import React, { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import { io } from 'socket.io-client';

const API = process.env.REACT_APP_API || 'http://localhost:5000/api';

export default function App() {
  const [token, setToken] = useState(localStorage.getItem('token') || '');
  const [user, setUser] = useState(null);
  const [form, setForm] = useState({ email: '', password: '', name: '' });
  const [matches, setMatches] = useState([]);
  const [threads, setThreads] = useState([]);
  const [activeThread, setActiveThread] = useState(null);
  const [messages, setMessages] = useState([]);
  const socketRef = useRef(null);

  useEffect(() => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = 'Bearer ' + token;
      fetchMe();
      // init socket
      socketRef.current = io('http://localhost:5000', { auth: { token } });
      socketRef.current.on('message', (data) => {
        if (data.threadId === activeThread?._id) setMessages(prev => [...prev, data]);
      });
    }
  }, [token]);

  async function register() {
    await axios.post('/api/auth/register', { name: form.name, email: form.email, password: form.password });
    alert('Registered. Please login.');
  }

  async function login() {
    const res = await axios.post('/api/auth/login', { identifier: form.email, password: form.password });
    setToken(res.data.token);
    localStorage.setItem('token', res.data.token);
  }

  async function fetchMe() {
    const res = await axios.get(API + '/profile/me');
    setUser(res.data);
  }

  async function findSimple() {
    const res = await axios.get(API + '/match/simple');
    setMatches(res.data);
  }
  async function findAI() {
    const res = await axios.get(API + '/match/ai');
    setMatches(res.data.map(s => s.user));
  }

  async function openThreadWith(userId) {
    const res = await axios.post(API + '/chat/thread', { otherUserId: userId });
    const thread = res.data;
    setActiveThread(thread);
    socketRef.current.emit('joinThread', { threadId: thread._id });
    // fetch messages
    const msgs = await axios.get(API + '/chat/messages/' + thread._id);
    setMessages(msgs.data);
  }

  async function sendMessage(text) {
    if (!activeThread) return;
    const payload = { threadId: activeThread._id, content: text };
    await axios.post(API + '/chat/message', payload);
    socketRef.current.emit('sendMessage', { threadId: activeThread._id, content: text, sender: user?._id });
    setMessages(prev => [...prev, { content: text, sender: user?._id, threadId: activeThread._id }]);
  }

  if (!token) {
    return (
      <div style={{ padding: 20 }}>
        <h2>HackMate — Register / Login</h2>
        <input placeholder='Name' value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /><br/>
        <input placeholder='Email' value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} /><br/>
        <input placeholder='Password' type='password' value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} /><br/>
        <button onClick={register}>Register</button>
        <button onClick={login}>Login</button>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', gap: 20, padding: 20 }}>
      <div style={{ width: 300 }}>
        <h3>Welcome {user?.name}</h3>
        <button onClick={() => { localStorage.removeItem('token'); setToken(''); window.location.reload(); }}>Logout</button>
        <hr/>
        <button onClick={findSimple}>Find Simple Matches</button>
        <button onClick={findAI}>Find AI Matches</button>
        <ul>
          {matches.map(m => (
            <li key={m._id} style={{ margin: 8, border: '1px solid #ddd', padding: 6 }}>
              <strong>{m.name}</strong><br/>
              <div>Interests: {m.interests?.join(', ')}</div>
              <div>Skills: {m.skills?.join(', ')}</div>
              <button onClick={() => openThreadWith(m._id)}>Message</button>
            </li>
          ))}
        </ul>
      </div>
      <div style={{ flex: 1 }}>
        <h3>Chat</h3>
        <div style={{ border: '1px solid #ccc', height: 400, padding: 10, overflowY: 'auto' }}>
          {messages.map((m, i) => <div key={i}><strong>{m.sender}</strong>: {m.content}</div>)}
        </div>
        <ChatInput onSend={sendMessage} />
      </div>
    </div>
  );
}

function ChatInput({ onSend }) {
  const [text, setText] = useState('');
  return (
    <div style={{ marginTop: 10 }}>
      <input value={text} onChange={e => setText(e.target.value)} placeholder='Type a message' style={{ width: '70%' }} />
      <button onClick={() => { onSend(text); setText(''); }}>Send</button>
    </div>
  );
}
