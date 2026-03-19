import React, { useState, useEffect, useRef } from 'react';
import type { KeyboardEvent } from 'react';
import './App.css';

interface Station {
  name: string;
  x: number;
  y: number;
}

interface RouteType {
  color1: string;
  color2: string;
  label1: string;
  label2: string;
  stations: Station[];
  switchAt: number;
  duration: number;
  badge?: string;
  desc: string;
}

interface Message {
  id: number;
  role: 'ai' | 'user';
  content: React.ReactNode;
}

const routesData: RouteType[] = [
  {
    color1: '#D85A30', color2: '#185FA5', label1: '大兴机场线', label2: '10号线', duration: 52, badge: '最快',
    desc: '大兴机场线 + 10号线 · 1次换乘', switchAt: 2,
    stations: [
      { name: '大兴机场', x: 0.10, y: 0.85 }, { name: '大兴机场北', x: 0.23, y: 0.72 },
      { name: '草桥', x: 0.39, y: 0.57 }, { name: '劲松', x: 0.56, y: 0.40 },
      { name: '双井', x: 0.68, y: 0.32 }, { name: '国贸', x: 0.82, y: 0.22 },
    ]
  },
  {
    color1: '#D85A30', color2: '#3B6D11', label1: '大兴机场线', label2: '7号线', duration: 58,
    desc: '大兴机场线 + 7号线 · 1次换乘', switchAt: 2,
    stations: [
      { name: '大兴机场', x: 0.10, y: 0.85 }, { name: '大兴机场北', x: 0.23, y: 0.72 },
      { name: '草桥', x: 0.39, y: 0.57 }, { name: '大兴新城', x: 0.52, y: 0.46 },
      { name: '亦庄桥', x: 0.65, y: 0.36 }, { name: '国贸', x: 0.82, y: 0.22 },
    ]
  }
];

export default function App() {
  const [hasStarted, setHasStarted] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectedRoute, setSelectedRoute] = useState(0);
  
  const [inputVal, setInputVal] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  useEffect(() => {
    if (!sidebarOpen) return;
    
    const drawMap = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const panel = canvas.parentElement;
      if (!panel) return;

      const W = panel.offsetWidth;
      const H = panel.offsetHeight;
      canvas.width = W;
      canvas.height = H;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      ctx.fillStyle = isDark ? '#252522' : '#efede8';
      ctx.fillRect(0, 0, W, H);

      const route = routesData[selectedRoute];
      const stations = route.stations;
      const sw = route.switchAt;

      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      for (let i = 0; i < stations.length - 1; i++) {
        const a = stations[i], b = stations[i + 1];
        const c = i < sw ? route.color1 : route.color2;
        ctx.beginPath();
        ctx.moveTo(a.x * W, a.y * H);
        ctx.lineTo(b.x * W, b.y * H);
        ctx.strokeStyle = c;
        ctx.lineWidth = 4.5;
        ctx.stroke();
      }

      stations.forEach((s, i) => {
        const x = s.x * W, y = s.y * H;
        const isSwitch = i === sw;
        const isEnd = i === 0 || i === stations.length - 1;
        const r = isSwitch ? 9 : isEnd ? 8 : 6;

        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fillStyle = isDark ? '#1e1e1c' : '#fff';
        ctx.fill();
        ctx.strokeStyle = i <= sw ? route.color1 : route.color2;
        ctx.lineWidth = isEnd ? 3 : 2.5;
        ctx.stroke();

        ctx.fillStyle = isDark ? '#a0a09a' : '#666660';
        ctx.font = `${isEnd || isSwitch ? 600 : 400} 10.5px -apple-system, sans-serif`;
        const side = i < stations.length / 2 ? 1 : -1;
        ctx.textAlign = side > 0 ? 'left' : 'right';
        ctx.fillText(s.name, x + side * (r + 6), y + 4);
      });
    };

    const timer = setTimeout(drawMap, 300);
    window.addEventListener('resize', drawMap);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', drawMap);
    };
  }, [selectedRoute, sidebarOpen]);

  const handleSend = () => {
    if (!inputVal.trim()) return;
    
    if (!hasStarted) {
      setHasStarted(true);
      setSidebarOpen(true);
    }

    const newMessages: Message[] = [
      ...messages,
      { id: Date.now(), role: 'user', content: inputVal }
    ];
    setMessages(newMessages);
    setInputVal('');
    setIsTyping(true);

    setTimeout(() => {
      setIsTyping(false);
      setMessages([
        ...newMessages,
        { id: Date.now() + 1, role: 'ai', content: '看什么看这里什么都没有' }
      ]);
    }, 1000);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') handleSend();
  };

  return (
    <div id="app">
      <div 
        id="drawer-overlay" 
        className={historyOpen ? 'show' : ''} 
        onClick={() => setHistoryOpen(false)}
      />

      <div id="topbar">
        <button id="menu-btn" className={historyOpen ? 'open' : ''} onClick={() => setHistoryOpen(!historyOpen)}>
          <span/><span/><span/>
        </button>
        <div className="logo-area">
          <span className="logo-text">地铁 AI 助手</span>
        </div>
        <button id="sidebar-toggle-btn" onClick={() => setSidebarOpen(!sidebarOpen)}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <rect x="3" y="3" width="18" height="18" rx="2" />
            <path d="M15 3v18" />
          </svg>
        </button>
      </div>

      <div id="history-drawer" className={historyOpen ? 'open' : ''}>
         <div className="history-section-label">今天</div>
         <div className="history-item">大兴机场到国贸路线</div>
      </div>

      <div id="main" className={sidebarOpen ? 'sidebar-open' : ''}>
        <div id="chat-area">
          {!hasStarted ? (
            <div className="welcome-screen">
              <div className="welcome-logo">
                <div className="metro-icon large">
                  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M4 18L8 6l4 8 4-8 4 12" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
              </div>
              <h2 className="welcome-title">今天想去哪里？</h2>
              
              <div className="welcome-input-wrapper">
                <div className="input-box shadow-xl">
                  <input 
                    type="text" 
                    value={inputVal}
                    onChange={(e) => setInputVal(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="试试问：从大兴机场到国贸怎么走？" 
                    autoFocus
                  />
                  <button className="send-btn" onClick={handleSend}>发送</button>
                </div>
                <div className="input-hint">地铁 AI 助手仅供参考，请以官方信息为准</div>
              </div>
            </div>
          ) : (
            <>
              <div id="messages">
                {messages.map((msg) => (
                  <div key={msg.id} className={`msg-wrap ${msg.role}`}>
                    {msg.role === 'ai' && <div className="avatar ai">M</div>}
                    <div className={`bubble ${msg.role}`}>{msg.content}</div>
                    {msg.role === 'user' && <div className="avatar user">我</div>}
                  </div>
                ))}
                
                {isTyping && (
                  <div className="msg-wrap">
                    <div className="avatar ai">M</div>
                    <div className="bubble ai">
                      <div className="typing-indicator"><span/><span/><span/></div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              <div id="input-area">
                <div className="input-box">
                  <input 
                    type="text" 
                    value={inputVal}
                    onChange={(e) => setInputVal(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="尝试输入..." 
                    autoFocus
                  />
                  <button className="send-btn" onClick={handleSend}>发送</button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      <div id="sidebar" className={sidebarOpen ? 'open' : ''}>
        <div className="panel-label">推荐路线</div>
        <div id="route-panel">
          {routesData.map((route, idx) => (
            <div 
              key={idx} 
              className={`route-card ${selectedRoute === idx ? 'selected' : ''}`}
              onClick={() => setSelectedRoute(idx)}
            >
              <div className="line-dot" style={{ background: route.color1 }} />
              <div className="route-info-text">
                <div className="route-name">大兴机场 → 国贸</div>
                <div className="route-sub">{route.desc}</div>
              </div>
              <div className="route-duration">{route.duration} 分</div>
            </div>
          ))}
        </div>
        <div className="panel-label">线路地图</div>
        <div id="map-panel">
          <canvas ref={canvasRef} id="metro-map" />
        </div>
      </div>
    </div>
  );
}
