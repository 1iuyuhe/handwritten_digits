import torch
import os
import random
import matplotlib.pyplot as plt
from torch.autograd import Variable
from torch.utils.data import DataLoader
from torchvision.datasets import mnist
from torchvision import transforms
from net import Net


DATA_PATH = './dataset/'
SAVE_PATH = './model/'

# 加载测试数据
test_set = mnist.MNIST(DATA_PATH, train=False, transform=transforms.ToTensor(), download=True)
test_data = DataLoader(test_set, batch_size=128, shuffle=False)

# 构建网络
net = Net()

# 加载训练好的模型
net = torch.load(os.path.join(SAVE_PATH, 'model.pt'))
net.eval()

# 随机抽取一张图片进行测试
idx = random.randint(0, len(test_set))
img = test_set[idx][0].numpy()
img = img.reshape(28, 28)
label = test_set[idx][1]
input_img = test_set[idx][0]
input_img = input_img.reshape(input_img.size(0), -1)
input_img = Variable(input_img)
out = net(input_img)
_, pred = out.max(1)
print('预测结果: {}'.format(pred.item()))
plt.imshow(img, cmap='gray')
plt.title('label: {}'.format(label), fontsize=10, color='black')
plt.show()
