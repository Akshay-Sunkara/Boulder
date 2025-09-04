import re
import time
import requests
from selenium import webdriver
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.common.by import By
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.common.exceptions import TimeoutException, ElementClickInterceptedException, ElementNotInteractableException
import os
from datetime import datetime

os.makedirs("images", exist_ok=True)
os.makedirs("videos", exist_ok=True)

options = Options()
options.add_argument("--headless")
driver = webdriver.Chrome(service=Service(), options=options)

print("Opening main page...")
driver.get("https://kaya-app.kayaclimb.com/gym/mosaicboulders")
wait = WebDriverWait(driver, 10)

for _ in range(14):
    try:
        load_more = WebDriverWait(driver, 5).until(
            EC.element_to_be_clickable((By.CSS_SELECTOR, ".load-more-cta"))
        )
        print("Clicking 'Load More' button...")
        driver.execute_script("arguments[0].scrollIntoView(true);", load_more)
        load_more.click()
        time.sleep(4)
    except (TimeoutException, ElementClickInterceptedException):
        print("No 'Load More' button found or click intercepted.")
        break

class_name_to_find = "climb-location-icons-meta"
elements = driver.find_elements(By.CLASS_NAME, class_name_to_find)

for element_index, element in enumerate(elements):
    try:
        text = element.get_attribute("innerText").strip()
        print(f"[{element_index}] Processing location: {text}")

        parent = element.find_element(By.XPATH, "./ancestor::a")
        href = parent.get_attribute("href")
        print(f"Opening link: {href}")
        driver.execute_script("window.open(arguments[0], '_blank');", href)
        driver.switch_to.window(driver.window_handles[-1])

        try:
            posts = WebDriverWait(driver, 10).until(
                EC.presence_of_all_elements_located((By.CLASS_NAME, "post"))
            )
            print(f"Found {len(posts)} posts.")

            for post_index, post in enumerate(posts):
                post_ts = datetime.now().strftime("%Y%m%d_%H%M%S")
                print(f"[Post {post_index}] Processing post at {post_ts}")
                saved_images = []

                try:
                    # Download image
                    imgs = post.find_elements(By.TAG_NAME, "img")
                    for img_index, img in enumerate(imgs):
                        src = img.get_attribute("src")
                        if src:
                            print(f"[Post {post_index}][Img {img_index}] Downloading image: {src}")
                            img_data = requests.get(src).content
                            filename = f"images/{post_ts}.jpg"
                            with open(filename, "wb") as f:
                                f.write(img_data)
                            saved_images.append(filename)

                            ID = f"{post_ts}"
                            thumbURL = src
                            requests.post(
                                'http://10.31.6.22:5000/upsert',
                                headers={'Content-Type': 'application/json'},
                                json={'ID': ID, 'thumb_url': thumbURL, 'metadata': text}
                            )
                            break  

                    print(f"[Post {post_index}] Clicking post to open...")
                    driver.execute_script("arguments[0].scrollIntoView(true);", post)
                    try:
                        post.click()
                    except ElementNotInteractableException:
                        print(f"[Post {post_index}] Element not interactable, using JS click...")
                        driver.execute_script("arguments[0].click();", post)
                    time.sleep(1)

                    try:
                        video = WebDriverWait(driver, 5).until(
                            EC.presence_of_element_located((By.CLASS_NAME, "video"))
                        )
                        print(f"[Post {post_index}] Video element found.")
                        src = video.get_attribute("src")
                        if not src:
                            try:
                                source_tag = video.find_element(By.TAG_NAME, "source")
                                src = source_tag.get_attribute("src")
                            except:
                                src = None

                        if src:
                            print(f"[Post {post_index}] Downloading video: {src}")
                            video_data = requests.get(src).content
                            filename = f"videos/{post_ts}.mp4"
                            with open(filename, "wb") as f:
                                f.write(video_data)
                        else:
                            print(f"[Post {post_index}] No video src found.")

                    except TimeoutException:
                        print(f"[Post {post_index}] No video found.")

                    try:
                        close_btn = WebDriverWait(driver, 5).until(
                            EC.element_to_be_clickable((By.CSS_SELECTOR, "div.btn-close"))
                        )
                        print(f"[Post {post_index}] Closing post modal...")
                        driver.execute_script("arguments[0].click();", close_btn)
                        time.sleep(0.5)
                    except TimeoutException:
                        print(f"[Post {post_index}] No close button found.")

                except Exception as e:
                    print(f"[Post {post_index}] Error encountered, skipping post: {e}")
                    for filename in saved_images:
                        try:
                            os.remove(filename)
                            print(f"[Post {post_index}] Deleted image: {filename}")
                        except:
                            pass
                    continue

        except TimeoutException:
            print("No posts found on page.")

        driver.close()
        driver.switch_to.window(driver.window_handles[0])

    except Exception as e:
        print(f"Error processing element: {e}")
