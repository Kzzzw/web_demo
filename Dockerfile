# 构建层
FROM super-tech-registry.cn-beijing.cr.aliyuncs.com/foundation/node:20.19-alpine AS base

# 配置 npm 镜像源（加速下载，如果网络没问题可以注释掉）
RUN npm config set registry https://registry.npmmirror.com

# 安装 pnpm（使用 npm 全局安装，指定版本确保稳定性）
RUN npm install -g pnpm@9.12.3 && \
    pnpm --version

# 设置工作路径
WORKDIR /build

# 先复制依赖相关文件，利用 Docker 层缓存
COPY package.json pnpm-lock.yaml ./

# 安装依赖（利用缓存，只有依赖文件变化时才重新安装）
RUN pnpm install --frozen-lockfile

# 再复制源代码
COPY . .

# 编译
RUN pnpm run build
    

# 运行层
FROM super-tech-registry.cn-beijing.cr.aliyuncs.com/foundation/nginx:1.28.0-alpine

# 设置工作路径
RUN mkdir -p /root/environment/nginx/html

# 拷贝 dist
COPY --from=base /build/dist /usr/share/nginx/html
# 拷贝 nginx 配置文件
COPY ./public/front/config/conf.d/default.conf /etc/nginx/conf.d/
# COPY ./cert.pem /etc/nginx/
# COPY ./key.pem /etc/nginx/

EXPOSE 80