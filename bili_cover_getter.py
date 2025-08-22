import requests
from bs4 import BeautifulSoup
import re

def get_bilibili_cover(video_url):
    """
    获取Bilibili视频的封面图片URL。

    :param video_url: B站视频的URL (例如: 'https://www.bilibili.com/video/BV1xx411c7mD')
    :return: 封面图片的URL字符串，如果失败则返回None。
    """
    # 1. 添加请求头，模拟浏览器访问，避免被网站屏蔽
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
    }

    try:
        # 2. 发送HTTP GET请求
        print(f"正在请求页面: {video_url}")
        response = requests.get(video_url, headers=headers, timeout=10)
        response.raise_for_status()  # 如果请求失败 (状态码不是200), 则会抛出异常

        # 3. 使用BeautifulSoup解析HTML
        soup = BeautifulSoup(response.text, 'html.parser')

        # 4. 查找包含封面URL的meta标签
        # B站封面URL在<meta property="og:image" content="...">标签里
        meta_tag = soup.find('meta', property='og:image')
        
        if meta_tag and meta_tag.get('content'):
            cover_url = meta_tag['content']
            # B站的URL可能前面缺少协议，例如 //i0.hdslb.com/...
            # 我们需要确保URL是完整的
            if cover_url.startswith('//'):
                cover_url = 'https:' + cover_url
            
            # 通常获取到的URL已经很清晰了，但有时会带有@后缀的尺寸参数，可以移除以获取原图
            # 比如 .../cover.jpg@672w_378h_1c_!web-search-common-cover.jpg
            # 我们可以用正则表达式把它清理干净
            clean_cover_url = re.sub(r'@.*', '', cover_url)
            
            return clean_cover_url
        else:
            print("错误：在页面中未找到封面meta标签。")
            return None

    except requests.exceptions.RequestException as e:
        print(f"请求失败: {e}")
        return None
    except Exception as e:
        print(f"发生未知错误: {e}")
        return None

# --- 主程序入口 ---
if __name__ == "__main__":
    # 输入你想要获取封面的B站视频链接
    # 可以是BV号链接，也可以是av号或者其他形式的链接
    bilibili_video_url = 'https://www.bilibili.com/video/BV1vsmSYdE94/'
    
    # 调用函数获取封面URL
    cover_image_url = get_bilibili_cover(bilibili_video_url)

    if cover_image_url:
        print("\nSuccessfully got the cover URL:")
        print(cover_image_url)

        # (可选) 如果想下载这张封面图，可以取消下面的代码注释
        # try:
        #     print("\n正在下载封面...")
        #     image_response = requests.get(cover_image_url, headers=headers)
        #     image_response.raise_for_status()
        #     
        #     # 从URL中提取文件名 (例如 BV1c5411T7o3.jpg)
        #     bv_id = bilibili_video_url.split('/')[-2] if bilibili_video_url.endswith('/') else bilibili_video_url.split('/')[-1]
        #     file_name = f"{bv_id}_cover.jpg"
        #
        #     with open(file_name, 'wb') as f:
        #         f.write(image_response.content)
        #     print(f"✅ 封面已成功保存为: {file_name}")
        #
        # except requests.exceptions.RequestException as e:
        #     print(f"下载图片失败: {e}")