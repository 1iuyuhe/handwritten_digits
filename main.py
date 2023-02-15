import torch
import time
import os
import random
from bottle import route, run, template, static_file, request
from torch.autograd import Variable
from torch.utils.data import DataLoader
from torchvision.datasets import mnist
from torchvision import transforms
from net import Net
from PIL import Image
import numpy as np


@route('/hello/<name>')
def hello(name):
    return template('<b>Hello, {{name}}!</b>', name=name)


@route('/')
def index():
    return template('index')


@route('/static/css/<filename:path>')
def css_file(filename):
    return static_file(filename, root='./assets/css')


@route('/static/js/<filename:path>')
def js_file(filename):
    return static_file(filename, root='./assets/js')


@route('/<filename:re:.*\.ico>')
def favicon(filename):
    return static_file(filename, root='./assets/')


@route('/images/<filename:path>')
def image_file(filename):
    return static_file(filename, root='./tmp/')


@route('/api/v1/recognize', method='POST')
def do_recognize():
    data = request.json
    if 'mode' not in data:
        return {"code": -1, "msg": "格式错误"}
    mode = data['mode']
    imageUrl = data['imageUrl']
    filename = imageUrl.split('/')[-1]
    filepath = os.path.join(TEMP_PATH, filename)
    if not os.path.exists(filepath):
        return {"code": -1, "msg": "图片不存在"}
    img = Image.open(filepath).convert('L')
    if mode == 2:
        img = img.resize((28, 28))
    img.save(os.path.join(TEMP_PATH, 'debug.png'))
    img = np.array(img, dtype=np.float32)
    input_img = transform(img)
    input_img = input_img.reshape(1, 28 * 28)
    input_img = Variable(input_img)
    out = net(input_img)
    _, pred = out.max(1)
    return {"code": 0, "msg": "成功", "data": pred.item()}


@route('/api/v1/random')
def do_random():
    idx = random.randint(0, len(test_set))
    img = test_set[idx][0].numpy()
    img = img * 255
    img = img.reshape(28, 28)
    img = Image.fromarray(img)
    filename = str(int(round(time.time() * 1000))) + '.png'
    img.convert('L').save(os.path.join(TEMP_PATH, filename))
    return {"code": 0, "msg": "成功", "data": '/images/{}'.format(filename)}


@route('/api/v1/upload', method='PUT')
def do_upload():
    upload = request.files.get('file')
    _, ext = os.path.splitext(upload.filename)
    if ext not in ('.png','.jpg','.jpeg'):
        return {"code": -1, "msg": 'File extension not allowed.'}
    filename = str(int(round(time.time() * 1000))) + '.png'
    filepath = os.path.join(TEMP_PATH, filename)
    upload.save(filepath)
    return {"code": 0, "msg": "成功", "data": '/images/{}'.format(filename)}


DATA_PATH = './dataset/'
SAVE_PATH = './model/'
TEMP_PATH = './tmp/'

transform = transforms.Compose([transforms.ToTensor()])

# 加载测试数据
test_set = mnist.MNIST(DATA_PATH, train=False, transform=transform, download=True)
test_data = DataLoader(test_set, batch_size=128, shuffle=False)

# 构建网络
net = Net()

# 加载训练好的模型
net = torch.load(os.path.join(SAVE_PATH, 'model.pt'))
net.eval()

if not os.path.exists(TEMP_PATH):
    os.makedirs(TEMP_PATH)
else:
    for filename in os.listdir(TEMP_PATH):
        os.remove(os.path.join(TEMP_PATH, filename))


run(host='localhost', port=8888)
