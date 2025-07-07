from PIL import Image
import io
import base64
import torch
from torchvision import models, transforms
from pinecone import Pinecone, ServerlessSpec
import requests
from flask import Flask, request, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

@app.route('/save-thumb', methods=['POST'])

def save_thumb():

    model = models.resnet50(pretrained=True)
    model = torch.nn.Sequential(*list(model.children())[:-1])
    model.eval()

    transform = transforms.Compose([
        transforms.Resize(256),
        transforms.CenterCrop(224),
        transforms.ToTensor(),
        transforms.Normalize(
            mean=[0.485, 0.456, 0.406],
            std=[0.229, 0.224, 0.225]
        ),
    ])

    def get_image_embedding(base64_str: str) -> list:

        img_bytes = base64.b64decode(base64_str)
        img = Image.open(io.BytesIO(img_bytes)).convert("RGB")
        tensor = transform(img).unsqueeze(0)

        with torch.no_grad():
            embedding = model(tensor).squeeze().numpy().flatten().tolist()

        return embedding
    
    data = request.get_json(force=True)
    print(f"Raw data: {data}")
    url = data.get('thumb_url')
    print(url)

    if not url:
        return jsonify({'error': 'No thumb_url'}), 400

    response = requests.get(url)
    b64 = base64.b64encode(response.content).decode("utf-8")
    vector = get_image_embedding(b64)

    pc = Pinecone(api_key="pcsk_4VyhHx_GmqWehoqx3UzWdz1PDCoXddGaFGm79ernjVQtJd2CXYrcYbu5JgwVAzfAE2kp3y")
    index = pc.Index(host="https://boulder-index-9nskykt.svc.aped-4627-b74a.pinecone.io")

    results = index.query(
        namespace="example",
        vector=vector,
        top_k=1
    )

    matches = results.get('matches', [])
    if matches:
        top_match = matches[0]
        response = {
            'id': top_match['id'],
        }
    else:
        response = {'message': 'No matches found'}

    return jsonify(response)

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)

#When we want to upload Betas
# index.upsert(
#     namespace="example",
#     vectors=[
#     {
#     "id": 'Route5',
#       "values": vector, 
#     },
#   ],
# )


