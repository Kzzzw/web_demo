<template>
  <div class="super-websocket-container">
    <!-- 聊天头部 -->
    <div class="chat-header">
      <div class="chat-title">
        <h3>{{ title }}</h3>
        <div class="connection-status" :class="connectionStatusClass">
          <span class="status-dot"></span>
          <span class="status-text">{{ connectionStatusText }}</span>
        </div>
        <div v-if="remainingTimeText" class="remaining-time-badge">
          剩余时间：{{ remainingTimeText }}
        </div>
      </div>
      <div class="chat-actions">
        <button 
          v-if="!isConnected" 
          @click="connect" 
          class="connect-btn"
          :disabled="isConnecting"
        >
          {{ isConnecting ? '连接中...' : '连接' }}
        </button>
        <button 
          v-else 
          @click="disconnect" 
          class="disconnect-btn"
        >
          断开
        </button>
      </div>
    </div>


    <!-- 消息列表 -->
    <div class="chat-messages" ref="messagesContainer">
      <div 
        v-for="message in messages" 
        :key="message.id" 
        class="message-item"
        :class="message.isOwn ? 'own-message' : 'other-message'"
      >
        <div class="message-avatar">
          <img 
            :src="message.isOwn ? currentUser.avatar : otherUser.avatar" 
            :alt="message.isOwn ? currentUser.name : otherUser.name"
          />
        </div>
        <div class="message-content">
          <div class="message-header">
            <span class="sender-name">{{ message.isOwn ? currentUser.name : otherUser.name }}</span>
            <span class="message-time">{{ formatTime(message.timestamp) }}</span>
          </div>
          <div class="message-bubble">
            <div class="message-text" v-if="!isJsonContent(message.content)">{{ message.content }}</div>
            <div class="message-text json-content" v-else>
              <pre>{{ formatJsonContent(message.content) }}</pre>
            </div>
            <!-- <div v-if="message.status" class="message-status">
              <span v-if="message.status === 'sending'" class="sending">发送中...</span>
              <span v-else-if="message.status === 'sent'" class="sent">✓</span>
              <span v-else-if="message.status === 'failed'" class="failed">✗</span>
            </div> -->
          </div>
        </div>
      </div>
      
      <!-- 空状态 -->
      <div v-if="messages.length === 0" class="empty-messages">
        <div class="empty-icon">💬</div>
        <div class="empty-text">暂无消息，开始聊天吧~</div>
      </div>
    </div>

    <!-- 输入区域 -->
    <div class="chat-input">
      <div class="input-toolbar">
        <button 
          v-for="action in inputActions" 
          :key="action.name"
          @click="action.handler"
          class="toolbar-btn"
          :title="action.title"
        >
          {{ action.icon }}
        </button>
      </div>
      <div class="input-area">
        <textarea
          v-model="inputMessage"
          @keydown="handleKeyDown"
          @input="handleInput"
          placeholder="输入消息..."
          class="message-input"
          :disabled="!isConnected"
          ref="messageInput"
        ></textarea>
        <button 
          @click="sendMessage" 
          class="send-btn"
          :disabled="!canSend"
        >
          发送
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, nextTick, watch } from 'vue'
import { WebSocketManager } from '@/utils/websocket'
import type { WebSocketMessage } from '@/utils/websocket'

// 消息类型定义
interface ChatMessage {
  id: string
  content: string
  isOwn: boolean
  timestamp: number
  status?: 'sending' | 'sent' | 'failed'
}

// 用户类型定义
interface User {
  id: string
  name: string
  avatar: string
}

// 组件属性
const props = defineProps({
  /** 聊天标题 */
  title: {
    type: String,
    default: 'WebSocket 聊天室'
  },
  /** WebSocket 服务器地址 */
  wsUrl: {
    type: String,
    required: true
  },
  /** 当前用户信息 */
  currentUser: {
    type: Object as () => User,
    required: true
  },
  /** 对方用户信息 */
  otherUser: {
    type: Object as () => User,
    required: true
  },
  /** 是否自动连接 */
  autoConnect: {
    type: Boolean,
    default: true
  }
})

// 响应式数据
const messages = ref<ChatMessage[]>([])
const inputMessage = ref('')
const isConnecting = ref(false)
const isConnected = ref(false)
const messagesContainer = ref<HTMLElement | null>(null)
const messageInput = ref<HTMLTextAreaElement | null>(null)

// 调试相关数据
const lastSentMessage = ref('')
const lastReceivedMessage = ref('')
// 会话剩余时间（格式化）
const remainingTimeText = ref('')

// WebSocket 管理器实例
let wsManager: WebSocketManager | null = null

// 输入工具栏配置
const inputActions = ref([
  {
    name: 'queryTime',
    icon: '⏰',
    title: '查询剩余时间',
    handler: () => {
      queryRemainingTime()
    }
  },
  {
    name: 'emoji',
    icon: '😊',
    title: '表情',
    handler: () => {
      // 这里可以集成表情选择器
      console.log('选择表情')
    }
  },
  {
    name: 'image',
    icon: '📷',
    title: '图片',
    handler: () => {
      // 这里可以集成图片上传
      console.log('选择图片')
    }
  },
  {
    name: 'file',
    icon: '📎',
    title: '文件',
    handler: () => {
      // 这里可以集成文件上传
      console.log('选择文件')
    }
  }
])

// 计算属性
const connectionStatusClass = computed(() => ({
  'status-connecting': isConnecting.value,
  'status-connected': isConnected.value,
  'status-disconnected': !isConnected.value && !isConnecting.value
}))

const connectionStatusText = computed(() => {
  if (isConnecting.value) return '连接中...'
  if (isConnected.value) return '已连接'
  return '未连接'
})

const canSend = computed(() => {
  return isConnected.value && inputMessage.value.trim().length > 0
})

// 初始化 WebSocket 连接
const initWebSocket = () => {
  wsManager = new WebSocketManager({
    url: props.wsUrl,
    autoReconnect: true,
    enableHeartbeat: true,
    reconnectInterval: 3000,
    heartbeatInterval: 30000
  })

  // 监听连接事件
  wsManager.on('connected', () => {
    isConnected.value = true
    isConnecting.value = false
    console.log('WebSocket 连接成功')
  })

  wsManager.on('disconnected', () => {
    isConnected.value = false
    isConnecting.value = false
    console.log('WebSocket 连接断开')
  })

  wsManager.on('connecting', () => {
    isConnecting.value = true
    console.log('WebSocket 连接中...')
  })

  wsManager.on('error', (error) => {
    console.error('WebSocket 错误:', error)
  })

  wsManager.on('reconnecting', (attempts) => {
    console.log(`WebSocket 重连中... (第 ${attempts} 次)`)
  })

  // 监听消息
  wsManager.onMessage((message) => {
    handleReceivedMessage(message)
  })
}

// 连接 WebSocket
const connect = async () => {
  if (!wsManager) {
    initWebSocket()
  }

  try {
    isConnecting.value = true
    await wsManager!.connect()
  } catch (error) {
    console.error('连接失败:', error)
    isConnecting.value = false
  }
}

// 断开 WebSocket
const disconnect = () => {
  wsManager?.disconnect()
  wsManager = null
}

// 发送消息
const sendMessage = () => {
  if (!canSend.value || !wsManager) return

  const messageContent = inputMessage.value.trim()
  if (!messageContent) return

  // 创建符合后端格式的消息对象
  const message = {
    type: 'local_msg_ts',
    content: messageContent
  }
  
  // 保存调试信息
  lastSentMessage.value = JSON.stringify(message, null, 2)

  // 添加到本地消息列表（乐观更新）
  const localMessage: ChatMessage = {
    id: generateMessageId(),
    content: messageContent,
    isOwn: true,
    timestamp: Date.now(),
    status: 'sending'
  }
  messages.value.push(localMessage)

  // 发送到服务器（直接发送符合后端格式的消息）
  wsManager?.send(message)

  // 清空输入框
  inputMessage.value = ''
  
  // 滚动到底部
  nextTick(() => {
    scrollToBottom()
  })
}

// 查询会话剩余时间
const queryRemainingTime = () => {
  if (!wsManager || !isConnected.value) return

  const text = 'query_remaining_time'

  console.log('🔍 发送查询剩余时间消息(纯文本):', text)
  
  // 保存调试信息
  lastSentMessage.value = text

  // 发送到服务器（纯文本）
  wsManager?.send(text)
}

// 处理接收到的消息
const handleReceivedMessage = (message: WebSocketMessage) => {
  // 调试：打印接收到的消息
  console.log('📥 接收到 WebSocket 消息:', JSON.stringify(message, null, 2))
  console.log('🔍 消息类型:', message.type)
  
  // 保存调试信息
  lastReceivedMessage.value = JSON.stringify(message, null, 2)
  
  // 处理后端返回的 local_msg_ts 消息格式（兼容 data/content）
  if (message.type === 'local_msg_ts' && (message.content ?? message.data)) {
    const payload = (message as any).content ?? (message as any).data
    console.log('✅ 处理后端 local_msg_ts 消息:', payload)
    
    let displayContent = payload
    
    // 如果 data 是 JSON 字符串，尝试解析并美化显示
    try {
      // 先去掉外层的引号
      const jsonStr = String(payload).replace(/^"(.*)"$/, '$1')
      // 解析 JSON
      const parsedData = JSON.parse(jsonStr)
      // 美化显示
      displayContent = JSON.stringify(parsedData, null, 2)
      console.log('📋 解析后的数据:', parsedData)
    } catch (error) {
      console.log('⚠️ 无法解析为 JSON，使用原始内容:', payload)
    }
    
    const chatMessage: ChatMessage = {
      id: message.id || generateMessageId(),
      content: displayContent,
      isOwn: false, // 后端消息标记为非自己的消息
      timestamp: message.timestamp || Date.now(),
      status: 'sent'
    }
    
    messages.value.push(chatMessage)
    
    // 滚动到底部
    nextTick(() => {
      scrollToBottom()
    })
  }
  // 处理查询剩余时间触发后的服务端结果（新协议：type=remaining_time）
  else if (message.type === 'remaining_time') {
    const formatted = (message as any).remainingFormatted
      ?? (message as any).data?.remainingFormatted
      ?? (message as any).content?.remainingFormatted
      ?? ''

    if (formatted) {
      remainingTimeText.value = String(formatted)
      console.log('⏰ 剩余时间更新为:', remainingTimeText.value)
    }
  }
  // 兼容原有的 msg_ts 格式（兼容 data/content）
  else if (message.type === 'msg_ts' && (message.content ?? message.data)) {
    const payload = (message as any).content ?? (message as any).data
    console.log('✅ 处理后端 msg_ts 消息:', payload)
    
    const chatMessage: ChatMessage = {
      id: message.id || generateMessageId(),
      content: payload,
      isOwn: false, // 后端消息标记为非自己的消息
      timestamp: message.timestamp || Date.now(),
      status: 'sent'
    }
    
    messages.value.push(chatMessage)
    
    // 滚动到底部
    nextTick(() => {
      scrollToBottom()
    })
  }
  // 兼容原有的消息格式
  else if (message.type === 'chat' && message.data) {
    console.log('✅ 处理原有格式消息:', message.data)
    
    const chatMessage: ChatMessage = {
      id: message.id || generateMessageId(),
      content: message.data.content,
      isOwn: message.data.sender === props.currentUser.id,
      timestamp: message.data.timestamp || Date.now(),
      status: 'sent'
    }
    
    messages.value.push(chatMessage)
    
    // 滚动到底部
    nextTick(() => {
      scrollToBottom()
    })
  } else {
    console.log('⚠️ 未识别的消息格式:', message)
  }
}

// 处理键盘事件
const handleKeyDown = (event) => {
  if (event.key === 'Enter' && !event.shiftKey) {
    event.preventDefault()
    sendMessage()
  }
}

// 处理输入事件
const handleInput = () => {
  // 这里可以添加输入状态通知等功能
}

// 滚动到底部
const scrollToBottom = () => {
  if (messagesContainer.value) {
    messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
  }
}

// 格式化时间
const formatTime = (timestamp: number) => {
  const date = new Date(timestamp)
  const now = new Date()
  const diff = now.getTime() - date.getTime()

  if (diff < 60000) { // 1分钟内
    return '刚刚'
  } else if (diff < 3600000) { // 1小时内
    return `${Math.floor(diff / 60000)}分钟前`
  } else if (diff < 86400000) { // 24小时内
    return date.toLocaleTimeString('zh-CN', { 
      hour: '2-digit', 
      minute: '2-digit' 
    })
  } else {
    return date.toLocaleDateString('zh-CN')
  }
}

// 生成消息ID
const generateMessageId = () => {
  return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

// 判断内容是否为 JSON 格式
const isJsonContent = (content: string) => {
  try {
    // 先去掉外层的引号
    const jsonStr = content.replace(/^"(.*)"$/, '$1')
    JSON.parse(jsonStr)
    return true
  } catch {
    return false
  }
}

// 格式化 JSON 内容
const formatJsonContent = (content: string) => {
  try {
    // 先去掉外层的引号
    const jsonStr = content.replace(/^"(.*)"$/, '$1')
    // 解析并美化 JSON
    const parsedData = JSON.parse(jsonStr)
    return JSON.stringify(parsedData, null, 2)
  } catch (error) {
    return content
  }
}

// 监听连接状态变化
watch(isConnected, (connected) => {
  if (connected) {
    // 连接成功后的处理
    nextTick(() => {
      scrollToBottom()
    })
  }
})

// 组件挂载
onMounted(() => {
  if (props.autoConnect) {
    connect()
  }
})

// 组件卸载
onUnmounted(() => {
  disconnect()
})
</script>

<style scoped lang="less">
.super-websocket-container {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.chat-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  background: #f8f9fa;
  border-bottom: 1px solid #e9ecef;
}

.chat-title {
  display: flex;
  align-items: center;
  gap: 12px;
  
  h3 {
    margin: 0;
    font-size: 18px;
    font-weight: 600;
    color: #333;
  }
}

.connection-status {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  
  .status-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: #dc3545;
  }
  
  &.status-connecting .status-dot {
    background: #ffc107;
    animation: pulse 1.5s infinite;
  }
  
  &.status-connected .status-dot {
    background: #28a745;
  }
  
  &.status-disconnected .status-dot {
    background: #dc3545;
  }
}

.remaining-time-badge {
  margin-left: 12px;
  padding: 2px 8px;
  background: #e6f4ff;
  color: #1677ff;
  border: 1px solid #91caff;
  border-radius: 12px;
  font-size: 12px;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

.chat-actions {
  display: flex;
  gap: 8px;
}

.connect-btn, .disconnect-btn {
  padding: 6px 12px;
  border: none;
  border-radius: 4px;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s;
}

.connect-btn {
  background: #007bff;
  color: white;
  
  &:hover:not(:disabled) {
    background: #0056b3;
  }
  
  &:disabled {
    background: #6c757d;
    cursor: not-allowed;
  }
}

.disconnect-btn {
  background: #dc3545;
  color: white;
  
  &:hover {
    background: #c82333;
  }
}

.chat-messages {
  flex: 1;
  padding: 16px;
  overflow-y: auto;
  background: #f8f9fa;
}

.message-item {
  display: flex;
  margin-bottom: 16px;
  gap: 8px;
  
  &.own-message {
    flex-direction: row-reverse;
    
    .message-content {
      align-items: flex-end;
    }
    
    .message-bubble {
      background: #007bff;
      color: white;
    }
  }
  
  &.other-message {
    .message-bubble {
      background: white;
      color: #333;
    }
  }
}

.message-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  overflow: hidden;
  flex-shrink: 0;
  
  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
}

.message-content {
  display: flex;
  flex-direction: column;
  max-width: 70%;
  gap: 4px;
}

.message-header {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  color: #666;
}

.sender-name {
  font-weight: 500;
}

.message-time {
  color: #999;
}

.message-bubble {
  padding: 10px 14px;
  border-radius: 18px;
  position: relative;
  word-wrap: break-word;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
}

.message-text {
  line-height: 1.4;
}

.message-status {
  position: absolute;
  right: -20px;
  bottom: 0;
  font-size: 12px;
  
  .sending {
    color: #ffc107;
  }
  
  .sent {
    color: #28a745;
  }
  
  .failed {
    color: #dc3545;
  }
}

.empty-messages {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 200px;
  color: #999;
  
  .empty-icon {
    font-size: 48px;
    margin-bottom: 16px;
  }
  
  .empty-text {
    font-size: 14px;
  }
}

.chat-input {
  padding: 16px 20px;
  background: white;
  border-top: 1px solid #e9ecef;
}

.input-toolbar {
  display: flex;
  gap: 8px;
  margin-bottom: 8px;
}

.toolbar-btn {
  width: 32px;
  height: 32px;
  border: none;
  border-radius: 4px;
  background: #f8f9fa;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  transition: all 0.2s;
  
  &:hover {
    background: #e9ecef;
  }
}

.input-area {
  display: flex;
  gap: 8px;
  align-items: flex-end;
}

.message-input {
  flex: 1;
  min-height: 40px;
  max-height: 120px;
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 20px;
  resize: none;
  font-size: 14px;
  line-height: 1.4;
  outline: none;
  transition: border-color 0.2s;
  
  &:focus {
    border-color: #007bff;
  }
  
  &:disabled {
    background: #f8f9fa;
    cursor: not-allowed;
  }
}

.send-btn {
  padding: 8px 16px;
  background: #007bff;
  color: white;
  border: none;
  border-radius: 20px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.2s;
  
  &:hover:not(:disabled) {
    background: #0056b3;
  }
  
  &:disabled {
    background: #6c757d;
    cursor: not-allowed;
  }
}

/* 滚动条样式 */
.chat-messages::-webkit-scrollbar {
  width: 6px;
}

.chat-messages::-webkit-scrollbar-track {
  background: #f1f1f1;
}

.chat-messages::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 3px;
}

.chat-messages::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}

// JSON 内容样式
.json-content {
  pre {
    background: #f8f9fa;
    border: 1px solid #e9ecef;
    border-radius: 6px;
    padding: 12px;
    margin: 0;
    font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
    font-size: 12px;
    line-height: 1.4;
    color: #333;
    white-space: pre-wrap;
    word-break: break-all;
    overflow-x: auto;
    max-height: 200px;
    overflow-y: auto;
  }
}

</style>
