from PIL import Image
import io
import base64
import torch
from pinecone import Pinecone, ServerlessSpec
import requests
from flask import Flask, request, jsonify
from flask_cors import CORS
from transformers import AutoImageProcessor, AutoModel
import numpy as np
import torchvision.transforms.functional as TF
import torch.nn.functional as F
from urllib.request import urlopen
import timm
import os
import cv2
import matplotlib.pyplot as plt
from detectron2.config import get_cfg
from detectron2.engine import DefaultPredictor
from detectron2.utils.visualizer import Visualizer
from detectron2.data import MetadataCatalog
from datetime import datetime
import openai

app = Flask(__name__)
CORS(app)

pc = Pinecone(api_key="pcsk_4VyhHx_GmqWehoqx3UzWdz1PDCoXddGaFGm79ernjVQtJd2CXYrcYbu5JgwVAzfAE2kp3y")
index = pc.Index(host="https://boulder-dino-giant-9nskykt.svc.aped-4627-b74a.pinecone.io")

processor = AutoImageProcessor.from_pretrained('facebook/dinov2-giant')
model = AutoModel.from_pretrained('facebook/dinov2-giant')
model.eval()

MODEL_DIRECTORY = "model"
cfg = get_cfg()
cfg.merge_from_file(os.path.join(MODEL_DIRECTORY, "experiment_config.yml"))
cfg.MODEL.WEIGHTS = os.path.join(MODEL_DIRECTORY, "model_final.pth")
cfg.MODEL.DEVICE = 'cpu'
MetadataCatalog.get("meta").thing_classes = ["hold", "volume"]
metadata = MetadataCatalog.get("meta")
predictor = DefaultPredictor(cfg)

SAVE_DIR = "processed_images"
os.makedirs(SAVE_DIR, exist_ok=True)
client = openai.Client(api_key='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')

def gem(x, p=3, eps=1e-6):
    return torch.pow(torch.mean(torch.pow(x.clamp(min=eps), p), dim=1), 1/p)

# def llm_captioning(image):
#     buffered = io.BytesIO()
#     image.save(buffered, format="JPEG")
#     base64_image = base64.b64encode(buffered.getvalue()).decode()

#     response = client.responses.create(
#         model="gpt-4.1",
#         input=[
#             {
#                 "role": "user",
#                 "content": [
#                     {"type": "input_text",
#                      "text": "What is the badge that shows the v grade in this image. If there is more than one badge, output the one that is most in focus. Output it as vx where x stands for the grade. Don't output anything else."},
#                     {"type": "input_image",
#                      "image_url": f"data:image/jpeg;base64,{base64_image}"}
#                 ]
#             }
#         ]
#     )
#     print(response.output_text)
#     return response.output_text

def save_processed_image(image_array, prefix="processed"):
    filename = f"{prefix}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.png"
    filepath = os.path.join(SAVE_DIR, filename)
    cv2.imwrite(filepath, cv2.cvtColor(image_array, cv2.COLOR_BGR2RGB))
    return filepath

def extract_dino_embedding(image, p=3):
    inputs = processor(images=image, return_tensors="pt")
    with torch.no_grad():
        outputs = model(**inputs)
        patch_tokens = outputs.last_hidden_state[:, 1:, :]  
        pooled = gem(patch_tokens, p=p)              
        pooled = F.normalize(pooled, p=2, dim=1)     
    return pooled.squeeze().tolist()

@app.route('/upsert', methods=['POST'])
def upsert():
    data = request.get_json(force=True)
    url = data.get('thumb_url')
    ID = data.get('ID')
    title = data.get('metadata')

    if not url:
        return jsonify({'error': 'No thumb_url'}), 400
    if not ID:
        return jsonify({'error': 'No ID'}), 400
    
    try:
        v_grade = title.split(",")[-1].strip() 
    except Exception:
        v_grade = None

    image = Image.open(requests.get(url, stream=True).raw)
    image = np.array(image)
    image = cv2.cvtColor(image, cv2.COLOR_RGB2BGR)
    outputs = predictor(image)

    instances = outputs["instances"].to("cpu")
    CONF_THRESH = 0.8
    high_conf_mask = instances.scores >= CONF_THRESH
    instances = instances[high_conf_mask]

    if instances.has("pred_masks"):
        masks = instances.pred_masks.numpy()  
        if masks.size != 0:
            combined_mask = np.any(masks, axis=0)  
            img_rgb = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
            black_background = np.zeros_like(img_rgb)
            image = np.where(combined_mask[:, :, None], img_rgb, black_background)

    save_processed_image(image)
    image_pil = Image.fromarray(image)
    vector = extract_dino_embedding(image_pil)

    metadata = {"title": title}
    if v_grade:
        metadata["v_grade"] = v_grade

    index.upsert(
        namespace="Default",
        vectors=[{"id": ID, "values": vector, "metadata": metadata}]
    )

    return jsonify({'message': f'Upserted ID {ID}'})

@app.route('/save-thumb', methods=['POST'])
def save_thumb():
    data = request.get_json(force=True)
    url = data.get('thumb_url')

    if not url:
        return jsonify({'error': 'No thumb_url'}), 400

    image = Image.open(requests.get(url, stream=True).raw)
    # v_tag = llm_captioning(image)
    image = np.array(image)
    image = cv2.cvtColor(image, cv2.COLOR_RGB2BGR)
    outputs = predictor(image)

    instances = outputs["instances"].to("cpu")
    CONF_THRESH = 0.8
    high_conf_mask = instances.scores >= CONF_THRESH
    instances = instances[high_conf_mask]

    if instances.has("pred_masks"):
        masks = instances.pred_masks.numpy()  
        if masks.size != 0:
            combined_mask = np.any(masks, axis=0)  
            img_rgb = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
            black_background = np.zeros_like(img_rgb)
            image = np.where(combined_mask[:, :, None], img_rgb, black_background)

    save_processed_image(image, prefix="save-thumb")
    image_pil = Image.fromarray(image)
    vector = extract_dino_embedding(image_pil)

    results = index.query(
        namespace="Default",
        vector=vector,
        top_k=50,  
        # filter={
        # "v_grade": {"$eq": f"{v_tag}"} 
        # },
        include_metadata=True,
        metric='cosine'
    )

    matches = results.get('matches', [])

    unique_matches = []
    seen_titles = set()
    for match in matches:
        title = match.get('metadata', {}).get('title', '')
        if title not in seen_titles:
            seen_titles.add(title)
            unique_matches.append(match)
        if len(unique_matches) >= 6: 
            break

    response = {}
    for i, match in enumerate(unique_matches):
        response[f'id{i}'] = match['id']
        response[f'score{i}'] = match['score']
    print(response)

    if not response:
        response = {'message': 'No matches found'}

    return jsonify(response)

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)
