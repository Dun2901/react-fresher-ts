import React, { useState, useRef, useEffect } from 'react';
import { FloatButton, Input, Button, Spin, Avatar } from 'antd';
import {
  CustomerServiceOutlined,
  SendOutlined,
  CloseOutlined,
  RobotOutlined,
} from '@ant-design/icons';
import { sendChatMessageAPI } from '@/services/api';

// Lightweight inline markdown renderer
const renderMarkdown = (text: string): React.ReactNode => {
  const lines = text.split('\n');
  const elements: React.ReactNode[] = [];

  const parseLine = (line: string, key: number): React.ReactNode => {
    // Split by **bold** markers
    const parts = line.split(/(\*\*[^*]+\*\*)/g);
    return (
      <span key={key}>
        {parts.map((part, i) =>
          part.startsWith('**') && part.endsWith('**') ? (
            <strong key={i}>{part.slice(2, -2)}</strong>
          ) : (
            part
          ),
        )}
      </span>
    );
  };

  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    // Bullet list: * or - prefix
    if (/^[*-]\s/.test(line)) {
      const listItems: React.ReactNode[] = [];
      while (i < lines.length && /^[*-]\s/.test(lines[i])) {
        listItems.push(<li key={i}>{parseLine(lines[i].replace(/^[*-]\s/, ''), i)}</li>);
        i++;
      }
      elements.push(<ul key={`ul-${i}`} style={{ margin: '4px 0', paddingLeft: '18px' }}>{listItems}</ul>);
      continue;
    }
    // Numbered list: 1. prefix
    if (/^\d+\.\s/.test(line)) {
      const listItems: React.ReactNode[] = [];
      while (i < lines.length && /^\d+\.\s/.test(lines[i])) {
        listItems.push(<li key={i}>{parseLine(lines[i].replace(/^\d+\.\s/, ''), i)}</li>);
        i++;
      }
      elements.push(<ol key={`ol-${i}`} style={{ margin: '4px 0', paddingLeft: '18px' }}>{listItems}</ol>);
      continue;
    }
    // Blank line -> spacing
    if (line.trim() === '') {
      elements.push(<div key={i} style={{ height: '6px' }} />);
    } else {
      elements.push(<div key={i}>{parseLine(line, i)}</div>);
    }
    i++;
  }
  return <>{elements}</>;
};

interface Message {
  sender: 'user' | 'bot';
  text: string;
}

const Chatbot: React.FC = () => {
  const [visible, setVisible] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      sender: 'bot',
      text: 'Xin chào! Mình là trợ lý ảo của Bookstore. Mình có thể giúp gì cho bạn hôm nay? Bạn có thể hỏi về các cuốn sách hiện có hoặc cách đặt hàng, thanh toán nhé!',
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const messageEndRef = useRef<HTMLDivElement>(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Auto scroll to bottom
  const scrollToBottom = () => {
    messageEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (visible) {
      setTimeout(scrollToBottom, 100);
    }
  }, [messages, visible]);

  const handleSend = async () => {
    if (!inputText.trim()) return;

    const userMsg = inputText.trim();
    setInputText('');
    setMessages((prev) => [...prev, { sender: 'user', text: userMsg }]);
    setLoading(true);

    try {
      // Format history to send to Gemini
      // Gemini expects: history: [{ role: 'user'|'model', text: string }]
      // We skip the first welcome message
      const history = messages.slice(1).map((msg) => ({
        role: msg.sender === 'user' ? 'user' : ('model' as 'user' | 'model'),
        text: msg.text,
      }));

      const res = await sendChatMessageAPI(userMsg, history);

      if (res?.data?.response) {
        setMessages((prev) => [...prev, { sender: 'bot', text: res.data.response }]);
      } else {
        setMessages((prev) => [
          ...prev,
          { sender: 'bot', text: 'Có lỗi xảy ra khi xử lý phản hồi từ AI.' },
        ]);
      }
    } catch (error) {
      console.error('Chatbot API error:', error);
      setMessages((prev) => [
        ...prev,
        { sender: 'bot', text: 'Không thể kết nối đến máy chủ AI lúc này. Vui lòng thử lại sau.' },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSend();
    }
  };

  const chatContent = (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Header */}
      <div
        style={{
          background: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)',
          color: 'white',
          padding: '16px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Avatar style={{ backgroundColor: '#ffedd5', color: '#f97316' }} icon={<RobotOutlined />} />
          <div>
            <div style={{ fontWeight: 700, fontSize: '15px', lineHeight: '1.2' }}>
              Trợ lý AI Bookstore
            </div>
            <div style={{ fontSize: '12px', opacity: 0.85, marginTop: '2px' }}>
              Tự động tư vấn 24/7
            </div>
          </div>
        </div>
        <Button
          type="text"
          icon={<CloseOutlined style={{ color: 'white' }} />}
          onClick={() => setVisible(false)}
          style={{
            width: '32px',
            height: '32px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        />
      </div>

      {/* Message List */}
      <div
        style={{
          flex: 1,
          padding: '16px',
          overflowY: 'auto',
          backgroundColor: '#f8fafc',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
        }}
      >
        {messages.map((msg, index) => {
          const isBot = msg.sender === 'bot';
          return (
            <div
              key={index}
              style={{
                display: 'flex',
                justifyContent: isBot ? 'flex-start' : 'flex-end',
                alignItems: 'flex-start',
                gap: '8px',
              }}
            >
              {isBot && (
                <Avatar
                  size="small"
                  style={{ backgroundColor: '#f97316', marginTop: '4px' }}
                  icon={<RobotOutlined />}
                />
              )}
              <div
                style={{
                  maxWidth: '75%',
                  padding: '10px 14px',
                  borderRadius: isBot ? '0px 12px 12px 12px' : '12px 12px 0px 12px',
                  backgroundColor: isBot ? 'white' : '#f97316',
                  color: isBot ? '#1f2937' : 'white',
                  fontSize: '13.5px',
                  lineHeight: '1.45',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                  whiteSpace: 'pre-wrap',
                }}
              >
                {isBot ? renderMarkdown(msg.text) : msg.text}
              </div>
            </div>
          );
        })}
        {loading && (
          <div
            style={{
              display: 'flex',
              justifyContent: 'flex-start',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <Avatar size="small" style={{ backgroundColor: '#f97316' }} icon={<RobotOutlined />} />
            <div
              style={{
                padding: '10px 14px',
                borderRadius: '0px 12px 12px 12px',
                backgroundColor: 'white',
                boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <span style={{ fontSize: '13px', color: '#64748b' }}>AI đang suy nghĩ</span>
              <Spin size="small" />
            </div>
          </div>
        )}
        <div ref={messageEndRef} />
      </div>

      {/* Input Form */}
      <div
        style={{
          padding: '12px',
          backgroundColor: 'white',
          borderTop: '1px solid #e5e7eb',
          display: 'flex',
          gap: '8px',
        }}
      >
        <Input
          placeholder="Hỏi về sách hoặc cách mua hàng..."
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onKeyDown={handleKeyPress}
          disabled={loading}
          style={{ flex: 1, borderRadius: '8px' }}
        />
        <Button
          type="primary"
          icon={<SendOutlined />}
          onClick={handleSend}
          disabled={loading || !inputText.trim()}
          style={{
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        />
      </div>
    </div>
  );

  return (
    <>
      {visible ? (
        <div
          style={{
            position: 'fixed',
            // Mobile: full screen above everything; Desktop: bottom-right popup
            ...(isMobile
              ? { top: 0, left: 0, right: 0, bottom: 0, width: '100%', height: '100dvh', borderRadius: 0 }
              : { right: 24, bottom: 24, width: 360, height: 'min(520px, calc(100vh - 48px))', borderRadius: '12px' }
            ),
            backgroundColor: 'white',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.15)',
            display: 'flex',
            flexDirection: 'column',
            zIndex: 9999,
            overflow: 'hidden',
            border: isMobile ? 'none' : '1px solid #e5e7eb',
          }}
        >
          {chatContent}
        </div>
      ) : (
        <FloatButton
          icon={<CustomerServiceOutlined />}
          type="primary"
          onClick={() => setVisible(true)}
          style={{
            right: 24,
            bottom: 80,
            width: 50,
            height: 50,
            boxShadow: '0 4px 12px rgba(249, 115, 22, 0.3)',
          }}
        />
      )}
    </>
  );
};

export default Chatbot;
