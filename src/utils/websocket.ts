/**
 * WebSocket 连接管理类
 * 提供高内聚低耦合的 WebSocket 连接管理功能
 * 支持断线自动重连、数据重发、心跳检测、自定义消息处理
 */
export interface WebSocketConfig {
  /** WebSocket 服务器地址 */
  url: string
  /** 重连间隔时间（毫秒） */
  reconnectInterval?: number
  /** 最大重连次数，-1 表示无限重连 */
  maxReconnectAttempts?: number
  /** 心跳间隔时间（毫秒） */
  heartbeatInterval?: number
  /** 心跳消息内容 */
  heartbeatMessage?: string
  /** 连接超时时间（毫秒） */
  connectionTimeout?: number
  /** 是否启用自动重连 */
  autoReconnect?: boolean
  /** 是否启用心跳检测 */
  enableHeartbeat?: boolean
}

export interface WebSocketMessage {
  /** 消息类型 */
  type: string
  /** 消息内容 */
  data?: any
  /** 可兼容的消息内容字段（部分接口使用 content） */
  content?: any
  /** 消息ID，用于重发机制 */
  id?: string
  /** 时间戳 */
  timestamp?: number
}

export type WebSocketEventHandler = (event: any) => void
export type MessageEventHandler = (message: WebSocketMessage) => void

export class WebSocketManager {
  private ws: WebSocket | null = null
  private config: Required<WebSocketConfig>
  private reconnectAttempts = 0
  private reconnectTimer: NodeJS.Timeout | null = null
  private heartbeatTimer: NodeJS.Timeout | null = null
  private connectionTimer: NodeJS.Timeout | null = null
  private messageQueue: (WebSocketMessage | string)[] = []
  private isConnecting = false
  private isDestroyed = false
  private sentMessages = new Set<string>() // 记录已发送的消息ID

  // 事件处理器
  private eventHandlers = new Map<string, Set<WebSocketEventHandler>>()
  private messageHandlers = new Set<MessageEventHandler>()

  constructor(config: WebSocketConfig) {
    this.config = {
      reconnectInterval: 3000,
      maxReconnectAttempts: -1,
      heartbeatInterval: 30000,
      heartbeatMessage: 'ping',
      connectionTimeout: 10000,
      autoReconnect: true,
      enableHeartbeat: true,
      ...config
    }
  }

  /**
   * 连接到 WebSocket 服务器
   */
  public connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.isConnecting || this.isDestroyed) {
        reject(new Error('WebSocket is already connecting or destroyed'))
        return
      }

      this.isConnecting = true
      this.emit('connecting')

      try {
        this.ws = new WebSocket(this.config.url)
        this.setupEventListeners()

        // 设置连接超时
        this.connectionTimer = setTimeout(() => {
          if (this.ws?.readyState === WebSocket.CONNECTING) {
            this.ws.close()
            this.isConnecting = false
            reject(new Error('Connection timeout'))
          }
        }, this.config.connectionTimeout)

        // 连接成功
        this.ws.addEventListener('open', () => {
          this.isConnecting = false
          this.reconnectAttempts = 0
          this.clearConnectionTimer()
          this.emit('connected')
          this.startHeartbeat()
          this.flushMessageQueue()
          resolve()
        }, { once: true })

        // 连接失败
        this.ws.addEventListener('error', () => {
          this.isConnecting = false
          this.clearConnectionTimer()
          this.emit('error', new Error('WebSocket connection failed'))
          reject(new Error('WebSocket connection failed'))
        }, { once: true })

      } catch (error) {
        this.isConnecting = false
        this.clearConnectionTimer()
        reject(error)
      }
    })
  }

  /**
   * 断开 WebSocket 连接
   */
  public disconnect(): void {
    this.isDestroyed = true
    this.stopHeartbeat()
    this.clearReconnectTimer()
    this.clearConnectionTimer()
    
    if (this.ws) {
      this.ws.close(1000, 'Normal closure')
      this.ws = null
    }
    
    // 清理已发送消息记录，避免内存泄漏
    this.sentMessages.clear()
    
    this.emit('disconnected')
  }

  /**
   * 发送消息
   */
  public send(message: WebSocketMessage | string): void {
    // 处理纯文本消息（例如 'ping' 或 'query_remaining_time'）
    if (typeof message === 'string') {
      if (!this.isConnected()) {
        this.messageQueue.push(message)
        if (this.config.autoReconnect && !this.isConnecting) {
          this.scheduleReconnect()
        }
        return
      }
      try {
        this.ws!.send(message)
        this.emit('messageSent', message)
      } catch (error) {
        console.error('❌ WebSocket 发送失败:', error)
        this.emit('error', error)
      }
      return
    }

    const messageId = message.id || this.generateMessageId()
    const finalMessage = {
      ...message,
      id: messageId,
      timestamp: Date.now()
    }

    // 检查是否已经发送过此消息
    if (this.sentMessages.has(messageId)) {
      console.log('消息已发送过，跳过:', messageId)
      return
    }

    if (!this.isConnected()) {
      // 如果未连接，将消息加入队列
      this.messageQueue.push(finalMessage)
      
      if (this.config.autoReconnect && !this.isConnecting) {
        this.scheduleReconnect()
      }
      return
    }

    try {
      const messageStr = JSON.stringify(finalMessage)
      
      // 调试：打印实际发送的 JSON 字符串
      console.log('🌐 WebSocket 实际发送的 JSON:', messageStr)
      console.log('📊 发送的消息对象:', finalMessage)
      
      this.ws!.send(messageStr)
      this.sentMessages.add(messageId)
      this.emit('messageSent', finalMessage)
    } catch (error) {
      console.error('❌ WebSocket 发送失败:', error)
      this.emit('error', error)
    }
  }

  /**
   * 检查连接状态
   */
  public isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN
  }

  /**
   * 获取连接状态
   */
  public getReadyState(): number {
    return this.ws?.readyState ?? WebSocket.CLOSED
  }

  /**
   * 添加事件监听器
   */
  public on(event: string, handler: WebSocketEventHandler): void {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, new Set())
    }
    this.eventHandlers.get(event)!.add(handler)
  }

  /**
   * 移除事件监听器
   */
  public off(event: string, handler: WebSocketEventHandler): void {
    const handlers = this.eventHandlers.get(event)
    if (handlers) {
      handlers.delete(handler)
    }
  }

  /**
   * 添加消息监听器
   */
  public onMessage(handler: MessageEventHandler): void {
    this.messageHandlers.add(handler)
  }

  /**
   * 移除消息监听器
   */
  public offMessage(handler: MessageEventHandler): void {
    this.messageHandlers.delete(handler)
  }

  /**
   * 设置事件监听器
   */
  private setupEventListeners(): void {
    if (!this.ws) return

    this.ws.addEventListener('open', () => {
      this.emit('open')
    })

    this.ws.addEventListener('close', (event) => {
      this.emit('close', event)
      this.handleDisconnection()
    })

    this.ws.addEventListener('error', (event) => {
      this.emit('error', event)
    })

    this.ws.addEventListener('message', (event) => {
      try {
        const message: WebSocketMessage = JSON.parse(event.data)
        this.handleMessage(message)
      } catch (_) {
        const text = String(event.data)
        if (text === 'pong') {
          this.emit('heartbeat')
          return
        }
        this.handleMessage({ type: 'text', data: text })
      }
    })
  }

  /**
   * 处理接收到的消息
   */
  private handleMessage(message: WebSocketMessage): void {
    // 处理心跳响应
    if (message.type === 'pong') {
      this.emit('heartbeat')
      return
    }

    // 通知所有消息监听器
    this.messageHandlers.forEach(handler => {
      try {
        handler(message)
      } catch (error) {
        this.emit('error', error)
      }
    })

    this.emit('message', message)
  }

  /**
   * 处理断开连接
   */
  private handleDisconnection(): void {
    this.stopHeartbeat()
    
    if (this.isDestroyed) {
      return
    }

    this.emit('disconnected')

    if (this.config.autoReconnect) {
      this.scheduleReconnect()
    }
  }

  /**
   * 安排重连
   */
  private scheduleReconnect(): void {
    if (this.reconnectTimer || this.isDestroyed) {
      return
    }

    if (this.config.maxReconnectAttempts !== -1 && 
        this.reconnectAttempts >= this.config.maxReconnectAttempts) {
      this.emit('maxReconnectAttemptsReached')
      return
    }

    this.reconnectAttempts++
    this.emit('reconnecting', this.reconnectAttempts)

    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null
      this.connect().catch(() => {
        // 重连失败，继续尝试
      })
    }, this.config.reconnectInterval)
  }

  /**
   * 开始心跳检测
   */
  private startHeartbeat(): void {
    if (!this.config.enableHeartbeat) {
      return
    }

    this.stopHeartbeat()
    // 发送纯文本心跳
    // this.heartbeatTimer = setInterval(() => {
    //   if (this.isConnected()) {
    //     this.send('ping')
    //     this.cleanupSentMessages()
    //   }
    // }, this.config.heartbeatInterval)
  }

  /**
   * 停止心跳检测
   */
  private stopHeartbeat(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer)
      this.heartbeatTimer = null
    }
  }

  /**
   * 清空重连定时器
   */
  private clearReconnectTimer(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer)
      this.reconnectTimer = null
    }
  }

  /**
   * 清空连接超时定时器
   */
  private clearConnectionTimer(): void {
    if (this.connectionTimer) {
      clearTimeout(this.connectionTimer)
      this.connectionTimer = null
    }
  }

  /**
   * 刷新消息队列
   */
  private flushMessageQueue(): void {
    // 创建队列副本，避免在发送过程中修改原队列
    const messagesToSend = [...this.messageQueue]
    this.messageQueue = []
    
    messagesToSend.forEach(message => {
      this.send(message)
    })
  }

  /**
   * 生成消息ID
   */
  private generateMessageId(): string {
    return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  /**
   * 清理过期的已发送消息记录
   * 避免内存泄漏，只保留最近1小时的消息记录
   */
  private cleanupSentMessages(): void {
    const oneHourAgo = Date.now() - 60 * 60 * 1000
    const messagesToKeep = new Set<string>()
    
    this.sentMessages.forEach(messageId => {
      // 从消息ID中提取时间戳（格式：msg_timestamp_random）
      const timestamp = parseInt(messageId.split('_')[1])
      if (timestamp > oneHourAgo) {
        messagesToKeep.add(messageId)
      }
    })
    
    this.sentMessages = messagesToKeep
  }

  /**
   * 触发事件
   */
  private emit(event: string, data?: any): void {
    const handlers = this.eventHandlers.get(event)
    if (handlers) {
      handlers.forEach(handler => {
        try {
          handler(data)
        } catch (error) {
          console.error(`Error in event handler for ${event}:`, error)
        }
      })
    }
  }
}
