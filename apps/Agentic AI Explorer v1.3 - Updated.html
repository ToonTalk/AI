// Agentic AI Explorer v1.3 - Updated 2025-01-09
// Latest fixes: Increased max_tokens to 4096, markdown rendering, resizable sidebar, auto-close rules
import React, { useState, useEffect, useRef } from 'react';
import { Send, Plus, Trash2, MessageSquare, Bot, ArrowRight, Edit2, Check, X, Save, Upload, RotateCcw, History } from 'lucide-react';

const MarkdownRenderer = ({ content, isUser = false }) => {
  const processInlineFormatting = (text) => {
    const segments = [];
    let remaining = text;
    let key = 0;
    let plainText = '';

    const pushPlainText = () => {
      if (plainText) {
        segments.push(plainText);
        plainText = '';
      }
    };

    while (remaining.length > 0) {
      // Check for inline code first (highest priority)
      const codeMatch = remaining.match(/^`([^`]+)`/);
      if (codeMatch) {
        pushPlainText();
        segments.push(
          <code key={key++} className={`px-1 rounded text-sm ${isUser ? 'bg-blue-700 text-white' : 'bg-gray-100 text-gray-900'}`}>
            {codeMatch[1]}
          </code>
        );
        remaining = remaining.slice(codeMatch[0].length);
        continue;
      }

      // Check for bold (must come before italic to handle ** before *)
      const boldMatch = remaining.match(/^\*\*([^*]+)\*\*/);
      if (boldMatch) {
        pushPlainText();
        segments.push(<strong key={key++}>{boldMatch[1]}</strong>);
        remaining = remaining.slice(boldMatch[0].length);
        continue;
      }

      // Check for italic
      const italicMatch = remaining.match(/^\*([^*]+)\*/);
      if (italicMatch) {
        pushPlainText();
        segments.push(<em key={key++}>{italicMatch[1]}</em>);
        remaining = remaining.slice(italicMatch[0].length);
        continue;
      }

      // No match, accumulate the character
      plainText += remaining[0];
      remaining = remaining.slice(1);
    }

    pushPlainText(); // Don't forget remaining plain text

    return segments.length > 0 ? segments : text;
  };

  const renderMarkdown = (text) => {
    // Split by code blocks first
    const parts = text.split(/(```[\s\S]*?```)/g);
    
    return parts.map((part, idx) => {
      if (part.startsWith('```')) {
        const code = part.slice(3, -3);
        const [lang, ...codeLines] = code.split('\n');
        return (
          <pre key={idx} className={`p-3 rounded my-2 overflow-x-auto ${isUser ? 'bg-blue-700 text-white' : 'bg-gray-800 text-gray-100'}`}>
            <code>{codeLines.join('\n')}</code>
          </pre>
        );
      }
      
      // Handle other markdown line by line
      const lines = part.split('\n');
      return (
        <div key={idx}>
          {lines.map((line, lineIdx) => {
            // Horizontal rule
            if (line.trim() === '---' || line.trim() === '***' || line.trim() === '___') {
              return <hr key={lineIdx} className="my-3 border-t border-gray-300" />;
            }

            // Headers
            if (line.startsWith('# ')) {
              return <h1 key={lineIdx} className="text-2xl font-bold mt-4 mb-2">{processInlineFormatting(line.slice(2))}</h1>;
            }
            if (line.startsWith('## ')) {
              return <h2 key={lineIdx} className="text-xl font-bold mt-3 mb-2">{processInlineFormatting(line.slice(3))}</h2>;
            }
            if (line.startsWith('### ')) {
              return <h3 key={lineIdx} className="text-lg font-bold mt-2 mb-1">{processInlineFormatting(line.slice(4))}</h3>;
            }

            // Numbered lists
            if (line.match(/^\d+\.\s/)) {
              return <li key={lineIdx} className="ml-4">{processInlineFormatting(line.replace(/^\d+\.\s*/, ''))}</li>;
            }

            // Bullet lists
            if (line.startsWith('- ') || line.startsWith('* ')) {
              return <li key={lineIdx} className="ml-4 list-disc">{processInlineFormatting(line.slice(2))}</li>;
            }

            // Empty line
            if (line.trim() === '') {
              return <br key={lineIdx} />;
            }
            
            // Regular paragraph with inline formatting
            return <p key={lineIdx} className="my-1">{processInlineFormatting(line)}</p>;
          })}
        </div>
      );
    });
  };
  
  return <div className="markdown-content">{renderMarkdown(content)}</div>;
};

export default function AgenticAIExplorer() {
  const [agents, setAgents] = useState([
    {
      id: 1,
      name: 'Helper',
      systemPrompt: 'You are a helpful, concise assistant.',
      conversations: [],
      rules: []
    }
  ]);
  const [selectedAgentId, setSelectedAgentId] = useState(1);
  const [userInput, setUserInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showNewAgentForm, setShowNewAgentForm] = useState(false);
  const [newAgentName, setNewAgentName] = useState('');
  const [newAgentPrompt, setNewAgentPrompt] = useState('');
  const [forwardingMessageId, setForwardingMessageId] = useState(null);
  const [forwardPrefix, setForwardPrefix] = useState('');
  const [forwardPostfix, setForwardPostfix] = useState('');
  const [editingAgentId, setEditingAgentId] = useState(null);
  const [editName, setEditName] = useState('');
  const [editPrompt, setEditPrompt] = useState('');
  const [activityLog, setActivityLog] = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  const [showRules, setShowRules] = useState(false);
  const [editingRule, setEditingRule] = useState(null);
  const [editRulePattern, setEditRulePattern] = useState('');
  const [editRuleType, setEditRuleType] = useState('contains');
  const [editRuleActions, setEditRuleActions] = useState([]);
  const [newRulePattern, setNewRulePattern] = useState('');
  const [newRuleType, setNewRuleType] = useState('contains');
  const [newRuleActions, setNewRuleActions] = useState([{ targetAgentId: '', message: '', useOriginalPrompt: true }]);
  const [newRuleEnabled, setNewRuleEnabled] = useState(true);
  const [rulesPaused, setRulesPaused] = useState(false);
  const [sidebarWidth, setSidebarWidth] = useState(256); // 256px = w-64
  const [isResizing, setIsResizing] = useState(false);
  
  const chatEndRef = useRef(null);
  const selectedAgent = agents.find(a => a.id === selectedAgentId);
  const fileInputRef = useRef(null);
  const rulesPausedRef = useRef(rulesPaused);
  const sidebarRef = useRef(null);

  // Keep ref in sync with state
  useEffect(() => {
    rulesPausedRef.current = rulesPaused;
  }, [rulesPaused]);

  // Handle sidebar resizing
  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!isResizing) return;
      const newWidth = e.clientX;
      if (newWidth >= 200 && newWidth <= 600) { // Min 200px, max 600px
        setSidebarWidth(newWidth);
      }
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      document.body.style.cursor = 'default';
      document.body.style.userSelect = 'auto';
    };

    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing]);

  const logActivity = (type, details) => {
    const logEntry = {
      timestamp: new Date().toISOString(),
      type,
      details
    };
    setActivityLog(prev => [...prev, logEntry]);
  };

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [selectedAgent?.conversations]);

  const createAgent = () => {
    if (!newAgentName.trim()) return;
    
    const newAgent = {
      id: Date.now(),
      name: newAgentName,
      systemPrompt: newAgentPrompt || 'You are a helpful assistant.',
      conversations: [],
      rules: []
    };
    
    setAgents([...agents, newAgent]);
    setSelectedAgentId(newAgent.id);
    logActivity('agent_created', {
      agentId: newAgent.id,
      name: newAgent.name,
      systemPrompt: newAgent.systemPrompt
    });
    setNewAgentName('');
    setNewAgentPrompt('');
    setShowNewAgentForm(false);
  };

  const deleteAgent = (id) => {
    if (agents.length === 1) {
      console.warn('Cannot delete the last agent!');
      return;
    }
    
    const agent = agents.find(a => a.id === id);
    logActivity('agent_deleted', {
      agentId: id,
      name: agent.name
    });
    
    const filtered = agents.filter(a => a.id !== id);
    setAgents(filtered);
    if (selectedAgentId === id) {
      setSelectedAgentId(filtered[0].id);
    }
  };

  const startEditAgent = (agent) => {
    setEditingAgentId(agent.id);
    setEditName(agent.name);
    setEditPrompt(agent.systemPrompt);
  };

  const saveAgentEdit = () => {
    if (!editName.trim()) return;
    
    const oldAgent = agents.find(a => a.id === editingAgentId);
    
    setAgents(agents.map(a => {
      if (a.id === editingAgentId) {
        return {
          ...a,
          name: editName,
          systemPrompt: editPrompt
        };
      }
      return a;
    }));
    
    logActivity('agent_edited', {
      agentId: editingAgentId,
      oldName: oldAgent.name,
      newName: editName,
      oldPrompt: oldAgent.systemPrompt,
      newPrompt: editPrompt
    });
    
    setEditingAgentId(null);
    setEditName('');
    setEditPrompt('');
  };

  const cancelEdit = () => {
    setEditingAgentId(null);
    setEditName('');
    setEditPrompt('');
  };

  const sendMessage = async (message, targetAgentId = selectedAgentId) => {
    if (!message.trim()) return;
    
    // Get current agent data first
    const agent = agents.find(a => a.id === targetAgentId);
    if (!agent) return;
    
    setIsLoading(true);
    setUserInput('');
    setShowRules(false); // Close rules panel when sending message
    
    const messagesToSend = [...agent.conversations, { role: 'user', content: message }];
    
    logActivity('user_message', {
      agentId: targetAgentId,
      agentName: agent.name,
      message: message
    });

    try {
      // Update state optimistically
      setAgents(prevAgents => prevAgents.map(a => {
        if (a.id === targetAgentId) {
          return {
            ...a,
            conversations: [...a.conversations, { role: 'user', content: message }]
          };
        }
        return a;
      }));

      // Clean messages for API - remove id field
      const cleanMessages = messagesToSend.map(({ role, content }) => ({ role, content }));
      
      const requestBody = {
        model: 'claude-sonnet-4-20250514',
        max_tokens: 4096,
        system: agent.systemPrompt,
        messages: cleanMessages
      };
      
      console.log('Sending request to Claude API:', requestBody);
      
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
      });

      const data = await response.json();
      
      if (!response.ok) {
        console.error('API Error Response:', data);
        throw new Error(data.error?.message || `API request failed with status ${response.status}`);
      }
      
      if (data.content && data.content[0]) {
        const assistantMessage = data.content[0].text;
        
        logActivity('assistant_response', {
          agentId: targetAgentId,
          agentName: agent.name,
          message: assistantMessage
        });
        
        // Build the updated agents array based on what setState will receive
        // We need to use functional setState to get the LATEST agents
        setAgents(prevAgents => {
          const updatedAgents = prevAgents.map(a => {
            if (a.id === targetAgentId) {
              return {
                ...a,
                conversations: [
                  ...a.conversations,
                  { role: 'assistant', content: assistantMessage, id: Date.now() }
                ]
              };
            }
            return a;
          });
          
          // Call checkRules with the updated agents
          // This happens synchronously inside the setState callback
          checkRules(targetAgentId, assistantMessage, message, updatedAgents);
          
          return updatedAgents;
        });
      } else {
        throw new Error('No content in API response');
      }
    } catch (error) {
      console.error('Error calling Claude API:', error);
      
      // Revert the optimistic update on error
      setAgents(prevAgents => prevAgents.map(a => {
        if (a.id === targetAgentId) {
          return {
            ...a,
            conversations: a.conversations.slice(0, -1) // Remove last message
          };
        }
        return a;
      }));
    } finally {
      setIsLoading(false);
    }
  };

  const forwardMessage = (messageContent, messageId) => {
    if (forwardingMessageId === messageId) {
      setForwardingMessageId(null);
      setForwardPrefix('');
      setForwardPostfix('');
    } else {
      setForwardingMessageId(messageId);
      setForwardPrefix('');
      setForwardPostfix('');
    }
  };

  const sendToAgent = (targetAgentId, messageContent) => {
    const fullMessage = `${forwardPrefix}${messageContent}${forwardPostfix}`;
    logActivity('message_forwarded', {
      fromAgentId: selectedAgentId,
      fromAgentName: selectedAgent.name,
      toAgentId: targetAgentId,
      toAgentName: agents.find(a => a.id === targetAgentId).name,
      prefix: forwardPrefix,
      postfix: forwardPostfix
    });
    setForwardingMessageId(null);
    setForwardPrefix('');
    setForwardPostfix('');
    setSelectedAgentId(targetAgentId); // Switch to the target agent
    sendMessage(fullMessage, targetAgentId);
  };

  const saveHistory = async () => {
    const historyData = {
      agents,
      activityLog,
      exportedAt: new Date().toISOString()
    };
    
    const dataStr = JSON.stringify(historyData, null, 2);
    
    try {
      await navigator.clipboard.writeText(dataStr);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
      logActivity('history_saved', { agentCount: agents.length, logEntries: activityLog.length });
    } catch (error) {
      console.error('Error copying to clipboard:', error);
    }
  };

  const loadHistory = (event) => {
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target.result);
        setAgents(data.agents || []);
        setActivityLog(data.activityLog || []);
        if (data.agents && data.agents.length > 0) {
          setSelectedAgentId(data.agents[0].id);
        }
        logActivity('history_loaded', { 
          agentCount: data.agents?.length || 0,
          logEntries: data.activityLog?.length || 0,
          importedFrom: data.exportedAt
        });
        console.log('History loaded successfully!');
      } catch (error) {
        console.error('Error loading history:', error);
      }
    };
    reader.readAsText(file);
    event.target.value = '';
  };

  const clearConversations = (agentId = null) => {
    if (agentId) {
      setAgents(prevAgents => {
        const agent = prevAgents.find(a => a.id === agentId);
        logActivity('conversations_cleared', {
          agentId,
          agentName: agent?.name
        });
        return prevAgents.map(a => {
          if (a.id === agentId) {
            return { ...a, conversations: [] };
          }
          return a;
        });
      });
    } else {
      setAgents(prevAgents => {
        logActivity('all_conversations_cleared', {
          agentCount: prevAgents.length
        });
        return prevAgents.map(a => ({
          id: a.id,
          name: a.name,
          systemPrompt: a.systemPrompt,
          rules: a.rules || [],
          conversations: []
        }));
      });
    }
  };

  const addRule = () => {
    // Pattern is not required for "always" type
    if (newRuleType !== 'always' && !newRulePattern.trim()) return;
    
    // Filter out empty actions
    const validActions = newRuleActions.filter(a => a.targetAgentId);
    if (validActions.length === 0) return;
    
    const rule = {
      id: Date.now(),
      pattern: newRulePattern,
      type: newRuleType,
      actions: validActions.map(a => ({
        targetAgentId: parseInt(a.targetAgentId),
        message: a.message,
        useOriginalPrompt: a.message ? false : (a.useOriginalPrompt !== false) // If custom message, don't use flag
      })),
      enabled: newRuleEnabled
    };
    
    setAgents(agents.map(a => {
      if (a.id === selectedAgentId) {
        return { ...a, rules: [...a.rules, rule] };
      }
      return a;
    }));
    
    logActivity('rule_added', {
      agentId: selectedAgentId,
      agentName: selectedAgent.name,
      pattern: newRulePattern,
      type: newRuleType,
      actionCount: validActions.length
    });
    
    setNewRulePattern('');
    setNewRuleType('contains');
    setNewRuleActions([{ targetAgentId: '', message: '', useOriginalPrompt: true }]);
    setNewRuleEnabled(true);
  };

  const deleteRule = (ruleId) => {
    setAgents(agents.map(a => {
      if (a.id === selectedAgentId) {
        return { ...a, rules: a.rules.filter(r => r.id !== ruleId) };
      }
      return a;
    }));
    
    logActivity('rule_deleted', {
      agentId: selectedAgentId,
      agentName: selectedAgent.name,
      ruleId
    });
  };

  const toggleRule = (ruleId) => {
    setAgents(agents.map(a => {
      if (a.id === selectedAgentId) {
        return {
          ...a,
          rules: a.rules.map(r => r.id === ruleId ? { ...r, enabled: !r.enabled } : r)
        };
      }
      return a;
    }));
  };

  const startEditRule = (rule) => {
    setEditingRule(rule.id);
    setEditRulePattern(rule.pattern);
    setEditRuleType(rule.type);
    // Handle backward compatibility with old single-action rules
    if (rule.actions) {
      setEditRuleActions(rule.actions.map(a => ({
        targetAgentId: String(a.targetAgentId),
        message: a.message || '',
        useOriginalPrompt: a.message ? false : (a.useOriginalPrompt !== false) // Default to true if not set
      })));
    } else {
      // Old format
      setEditRuleActions([{
        targetAgentId: String(rule.targetAgentId),
        message: rule.message || '',
        useOriginalPrompt: rule.message ? false : true
      }]);
    }
  };

  const saveRuleEdit = () => {
    // Pattern is not required for "always" type
    if (editRuleType !== 'always' && !editRulePattern.trim()) return;
    
    const validActions = editRuleActions.filter(a => a.targetAgentId);
    if (validActions.length === 0) return;
    
    setAgents(agents.map(a => {
      if (a.id === selectedAgentId) {
        return {
          ...a,
          rules: a.rules.map(r => {
            if (r.id === editingRule) {
              return {
                ...r,
                pattern: editRulePattern,
                type: editRuleType,
                actions: validActions.map(action => ({
                  targetAgentId: parseInt(action.targetAgentId),
                  message: action.message,
                  useOriginalPrompt: action.message ? false : (action.useOriginalPrompt !== false)
                }))
              };
            }
            return r;
          })
        };
      }
      return a;
    }));
    
    logActivity('rule_edited', {
      agentId: selectedAgentId,
      agentName: selectedAgent.name,
      ruleId: editingRule
    });
    
    setEditingRule(null);
    setEditRulePattern('');
    setEditRuleType('contains');
    setEditRuleActions([]);
  };

  const cancelRuleEdit = () => {
    setEditingRule(null);
    setEditRulePattern('');
    setEditRuleType('contains');
    setEditRuleActions([]);
  };

  const toggleRulesPaused = () => {
    const newState = !rulesPaused;
    setRulesPaused(newState);
    logActivity(newState ? 'rules_paused' : 'rules_unpaused', {
      timestamp: new Date().toISOString()
    });
  };

  const checkRules = (agentId, responseText, originalPrompt, currentAgents) => {
    if (rulesPausedRef.current) return; // Check current pause state
    
    if (!currentAgents) {
      console.error('currentAgents is undefined in checkRules');
      return;
    }
    
    const agent = currentAgents.find(a => a.id === agentId);
    if (!agent || !agent.rules) return;
    
    agent.rules.forEach(rule => {
      if (!rule.enabled) return;
      
      let matches = false;
      const lowerResponse = responseText.toLowerCase();
      const lowerPattern = rule.pattern.toLowerCase();
      
      switch (rule.type) {
        case 'always':
          matches = true; // Always trigger regardless of response content
          break;
        case 'contains':
          matches = lowerResponse.includes(lowerPattern);
          break;
        case 'equals':
          matches = lowerResponse.trim() === lowerPattern.trim();
          break;
        case 'starts_with':
          matches = lowerResponse.startsWith(lowerPattern);
          break;
        case 'ends_with':
          matches = lowerResponse.endsWith(lowerPattern);
          break;
        case 'regex':
          try {
            matches = new RegExp(rule.pattern, 'i').test(responseText);
          } catch (e) {
            console.error('Invalid regex:', e);
          }
          break;
      }
      
      if (matches) {
        // Handle both old and new format
        const actions = rule.actions || [{ targetAgentId: rule.targetAgentId, message: rule.message }];
        
        logActivity('rule_triggered', {
          agentId,
          agentName: agent.name,
          rulePattern: rule.pattern,
          actionCount: actions.length
        });
        
        // Execute actions in sequence
        actions.forEach((action, index) => {
          const delay = 500 + (index * 1000); // 500ms for first, then 1s between each
          
          setTimeout(() => {
            // Check pause state again at execution time
            if (rulesPausedRef.current) return;
            
            // Determine what message to send
            let messageToSend;
            if (action.message) {
              // Custom message takes precedence
              messageToSend = action.message;
            } else if (action.useOriginalPrompt === false) {
              // Explicitly set to forward response
              messageToSend = responseText;
            } else {
              // Default: forward original prompt (backward compatible)
              messageToSend = originalPrompt || responseText;
            }
            
            // Switch to target agent on last action
            if (index === actions.length - 1) {
              setSelectedAgentId(action.targetAgentId);
            }
            sendMessage(messageToSend, action.targetAgentId);
          }, delay);
        });
      }
    });
  };

  return (
    <div className="flex h-screen bg-gray-50 overflow-x-hidden">
      {/* Sidebar */}
      <div 
        ref={sidebarRef}
        style={{ width: `${sidebarWidth}px` }}
        className="bg-white border-r border-gray-200 flex flex-col overflow-hidden flex-shrink-0"
      >
        <div className="p-4 border-b border-gray-200">
          <h1 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <Bot className="w-6 h-6" />
            Agentic AI Explorer
          </h1>
          <div className="flex gap-2 mt-3">
            <button
              onClick={saveHistory}
              className={`flex-1 flex items-center justify-center gap-1 px-2 py-1.5 rounded text-xs transition-colors ${
                copySuccess
                  ? 'bg-green-600 text-white'
                  : 'bg-green-500 text-white hover:bg-green-600'
              }`}
              title={copySuccess ? 'Copied!' : 'Copy history to clipboard'}
            >
              <Save className="w-3 h-3" />
              {copySuccess ? 'Copied!' : 'Copy'}
            </button>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex-1 flex items-center justify-center gap-1 bg-blue-500 text-white px-2 py-1.5 rounded text-xs hover:bg-blue-600"
              title="Load history from file"
            >
              <Upload className="w-3 h-3" />
              Load
            </button>
            <button
              onClick={() => setShowHistory(!showHistory)}
              className={`flex-1 flex items-center justify-center gap-1 px-2 py-1.5 rounded text-xs transition-colors ${
                showHistory 
                  ? 'bg-purple-500 text-white hover:bg-purple-600' 
                  : 'bg-purple-100 text-purple-700 hover:bg-purple-200'
              }`}
              title={showHistory ? 'Hide activity log' : 'View activity log'}
            >
              <History className="w-3 h-3" />
              Log
            </button>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            onChange={loadHistory}
            className="hidden"
          />
        </div>

        {showHistory ? (
          <div className="flex-1 overflow-y-auto p-3">
            <h3 className="font-semibold text-sm mb-2 text-gray-700">Activity Log</h3>
            <div className="space-y-2">
              {activityLog.length === 0 ? (
                <p className="text-xs text-gray-500 italic">No activity yet</p>
              ) : (
                activityLog.slice().reverse().map((log, idx) => (
                  <div key={idx} className="bg-gray-50 p-2 rounded text-xs border border-gray-200">
                    <div className="font-semibold text-gray-700">
                      {log.type.replace(/_/g, ' ').toUpperCase()}
                    </div>
                    <div className="text-gray-500 text-xs mt-0.5">
                      {new Date(log.timestamp).toLocaleString()}
                    </div>
                    <div className="text-gray-600 mt-1 space-y-0.5">
                      {Object.entries(log.details).map(([key, value]) => (
                        <div key={key}>
                          <span className="font-medium">{key}:</span>{' '}
                          {typeof value === 'string' && value.length > 50
                            ? value.substring(0, 50) + '...'
                            : String(value)}
                        </div>
                      ))}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto p-3">
            <div className="space-y-2">
              {agents.map(agent => (
                <div
                  key={agent.id}
                  className={`p-3 rounded-lg transition-colors relative group ${
                    selectedAgentId === agent.id
                      ? 'bg-blue-50 border-2 border-blue-500'
                      : 'bg-gray-50 border-2 border-transparent hover:bg-gray-100'
                  }`}
                >
                  {editingAgentId === agent.id ? (
                    <div className="space-y-2" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="text"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Agent name"
                        autoFocus
                      />
                      <textarea
                        value={editPrompt}
                        onChange={(e) => setEditPrompt(e.target.value)}
                        className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="System prompt"
                        rows="3"
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={saveAgentEdit}
                          className="flex-1 flex items-center justify-center gap-1 bg-green-500 text-white px-2 py-1 rounded hover:bg-green-600 text-sm"
                        >
                          <Check className="w-3 h-3" />
                          Save
                        </button>
                        <button
                          onClick={cancelEdit}
                          className="flex-1 flex items-center justify-center gap-1 bg-gray-200 text-gray-700 px-2 py-1 rounded hover:bg-gray-300 text-sm"
                        >
                          <X className="w-3 h-3" />
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div onClick={() => setSelectedAgentId(agent.id)} className="cursor-pointer">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <MessageSquare className="w-4 h-4 flex-shrink-0" />
                          <span className="font-medium truncate">{agent.name}</span>
                        </div>
                        <div className="flex gap-1">
                          {agent.conversations.length > 0 && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                clearConversations(agent.id);
                              }}
                              className="opacity-0 group-hover:opacity-100 p-1 hover:bg-orange-100 rounded transition-opacity"
                              title="Clear conversations"
                            >
                              <RotateCcw className="w-4 h-4 text-orange-600" />
                            </button>
                          )}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              startEditAgent(agent);
                            }}
                            className="opacity-0 group-hover:opacity-100 p-1 hover:bg-blue-100 rounded transition-opacity"
                            title="Edit agent"
                          >
                            <Edit2 className="w-4 h-4 text-blue-600" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteAgent(agent.id);
                            }}
                            className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-100 rounded transition-opacity"
                            title="Delete agent"
                          >
                            <Trash2 className="w-4 h-4 text-red-600" />
                          </button>
                        </div>
                      </div>
                      <div className="text-xs text-gray-500 mt-1 truncate">
                        {agent.conversations.length} messages
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="p-3 border-t border-gray-200">
          {agents.some(a => a.conversations.length > 0) && (
            <button
              onClick={() => clearConversations()}
              className="w-full flex items-center justify-center gap-2 bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600 transition-colors mb-2 text-sm font-medium"
            >
              <Trash2 className="w-4 h-4" />
              Clear All Messages
            </button>
          )}
          {!showNewAgentForm ? (
            <button
              onClick={() => setShowNewAgentForm(true)}
              className="w-full flex items-center justify-center gap-2 bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors"
            >
              <Plus className="w-4 h-4" />
              New Agent
            </button>
          ) : (
            <div className="space-y-2">
              <input
                type="text"
                placeholder="Agent name"
                value={newAgentName}
                onChange={(e) => setNewAgentName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <textarea
                placeholder="System prompt (optional)"
                value={newAgentPrompt}
                onChange={(e) => setNewAgentPrompt(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                rows="3"
              />
              <div className="flex gap-2">
                <button
                  onClick={createAgent}
                  className="flex-1 bg-blue-500 text-white px-3 py-1.5 rounded hover:bg-blue-600 text-sm"
                >
                  Create
                </button>
                <button
                  onClick={() => {
                    setShowNewAgentForm(false);
                    setNewAgentName('');
                    setNewAgentPrompt('');
                  }}
                  className="flex-1 bg-gray-200 text-gray-700 px-3 py-1.5 rounded hover:bg-gray-300 text-sm"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Resize Handle */}
      <div
        onMouseDown={() => setIsResizing(true)}
        className="w-1 bg-gray-200 hover:bg-blue-500 cursor-col-resize flex-shrink-0 transition-colors"
        style={{ cursor: 'col-resize' }}
        title="Drag to resize sidebar"
      />

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Chat Header */}
        <div className="bg-white border-b border-gray-200 p-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex-1 min-w-0">
              <h2 className="text-lg font-semibold text-gray-800 truncate">{selectedAgent?.name}</h2>
              <p className="text-sm text-gray-500 truncate" title={selectedAgent?.systemPrompt}>
                {selectedAgent?.systemPrompt}
              </p>
            </div>
            <div className="flex gap-2 flex-shrink-0">{/* Buttons area */}
              <button
                onClick={toggleRulesPaused}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  rulesPaused
                    ? 'bg-red-500 text-white hover:bg-red-600'
                    : 'bg-green-500 text-white hover:bg-green-600'
                }`}
                title={rulesPaused ? 'Click to unpause rules' : 'Click to pause rules'}
              >
                {rulesPaused ? (
                  <>
                    <span className="w-2 h-2 bg-white rounded-full"></span>
                    Paused
                  </>
                ) : (
                  <>
                    <span className="w-2 h-2 bg-white rounded-full animate-pulse"></span>
                    Active
                  </>
                )}
              </button>
              <button
                onClick={() => setShowRules(!showRules)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                  showRules
                    ? 'bg-indigo-500 text-white'
                    : 'bg-indigo-100 text-indigo-700 hover:bg-indigo-200'
                }`}
              >
                <MessageSquare className="w-4 h-4" />
                Rules ({selectedAgent?.rules?.length || 0})
              </button>
            </div>
          </div>
          
          {showRules && (
            <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold">Conditional Rules</h3>
              </div>
              {rulesPaused && (
                <div className="mb-3 bg-yellow-100 border border-yellow-300 text-yellow-800 px-3 py-2 rounded text-sm">
                  ⚠️ All automatic rule execution is paused. Rules will not trigger until unpaused.
                </div>
              )}
              <div className="space-y-3 mb-4">
                {selectedAgent?.rules?.length === 0 ? (
                  <p className="text-sm text-gray-500 italic">No rules yet. Add a rule to automate workflows.</p>
                ) : (
                  selectedAgent?.rules?.map(rule => (
                    <div key={rule.id} className="bg-white p-3 rounded border border-gray-200">
                      {editingRule === rule.id ? (
                        <div className="space-y-3">
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="text-xs text-gray-600 block mb-1">Condition Type</label>
                              <select
                                value={editRuleType}
                                onChange={(e) => setEditRuleType(e.target.value)}
                                className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm"
                              >
                                <option value="always">Always (every response)</option>
                                <option value="contains">Contains</option>
                                <option value="equals">Equals</option>
                                <option value="starts_with">Starts with</option>
                                <option value="ends_with">Ends with</option>
                                <option value="regex">Regex</option>
                              </select>
                            </div>
                            <div>
                              <label className="text-xs text-gray-600 block mb-1">Pattern</label>
                              <input
                                type="text"
                                value={editRulePattern}
                                onChange={(e) => setEditRulePattern(e.target.value)}
                                disabled={editRuleType === 'always'}
                                placeholder={editRuleType === 'always' ? 'No pattern needed' : 'Enter pattern...'}
                                className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm disabled:bg-gray-100 disabled:text-gray-500"
                              />
                            </div>
                          </div>
                          
                          <div>
                            <label className="text-xs text-gray-600 block mb-2">Actions (in sequence)</label>
                            <div className="space-y-2">
                              {editRuleActions.map((action, idx) => (
                                <div key={idx} className="flex gap-2 items-start bg-gray-50 p-2 rounded">
                                  <span className="text-xs text-gray-500 mt-2">{idx + 1}.</span>
                                  <div className="flex-1 space-y-2">
                                    <select
                                      value={action.targetAgentId}
                                      onChange={(e) => {
                                        const newActions = [...editRuleActions];
                                        newActions[idx].targetAgentId = e.target.value;
                                        setEditRuleActions(newActions);
                                      }}
                                      className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm"
                                    >
                                      <option value="">Select agent...</option>
                                      {agents.map(agent => (
                                        <option key={agent.id} value={agent.id}>{agent.name}</option>
                                      ))}
                                    </select>
                                    <div className="space-y-1">
                                      <label className="flex items-center text-xs">
                                        <input
                                          type="radio"
                                          name={`edit-action-${idx}-type`}
                                          checked={!action.message && action.useOriginalPrompt !== false}
                                          onChange={() => {
                                            const newActions = [...editRuleActions];
                                            newActions[idx].useOriginalPrompt = true;
                                            newActions[idx].message = '';
                                            setEditRuleActions(newActions);
                                          }}
                                          className="mr-1"
                                        />
                                        Forward original prompt (default)
                                      </label>
                                      <label className="flex items-center text-xs">
                                        <input
                                          type="radio"
                                          name={`edit-action-${idx}-type`}
                                          checked={!action.message && action.useOriginalPrompt === false}
                                          onChange={() => {
                                            const newActions = [...editRuleActions];
                                            newActions[idx].useOriginalPrompt = false;
                                            newActions[idx].message = '';
                                            setEditRuleActions(newActions);
                                          }}
                                          className="mr-1"
                                        />
                                        Forward response
                                      </label>
                                      <label className="flex items-center text-xs">
                                        <input
                                          type="radio"
                                          name={`edit-action-${idx}-type`}
                                          checked={!!action.message}
                                          onChange={() => {
                                            const newActions = [...editRuleActions];
                                            newActions[idx].message = ' '; // Set to space to trigger checked
                                            setEditRuleActions(newActions);
                                          }}
                                          className="mr-1"
                                        />
                                        Custom message:
                                      </label>
                                      {action.message && (
                                        <input
                                          type="text"
                                          value={action.message}
                                          onChange={(e) => {
                                            const newActions = [...editRuleActions];
                                            newActions[idx].message = e.target.value;
                                            setEditRuleActions(newActions);
                                          }}
                                          placeholder="Enter custom message"
                                          className="w-full px-2 py-1 border border-gray-300 rounded text-sm ml-4"
                                        />
                                      )}
                                    </div>
                                  </div>
                                  <button
                                    onClick={() => {
                                      setEditRuleActions(editRuleActions.filter((_, i) => i !== idx));
                                    }}
                                    className="p-1 hover:bg-red-100 rounded mt-1"
                                    disabled={editRuleActions.length === 1}
                                  >
                                    <Trash2 className="w-3 h-3 text-red-600" />
                                  </button>
                                </div>
                              ))}
                            </div>
                            <button
                              onClick={() => {
                                setEditRuleActions([...editRuleActions, { targetAgentId: '', message: '', useOriginalPrompt: true }]);
                              }}
                              className="mt-2 text-sm text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
                            >
                              <Plus className="w-4 h-4" />
                              Add Action
                            </button>
                          </div>
                          
                          <div className="flex gap-2">
                            <button
                              onClick={saveRuleEdit}
                              className="flex-1 flex items-center justify-center gap-1 bg-green-500 text-white px-3 py-1.5 rounded hover:bg-green-600 text-sm"
                            >
                              <Check className="w-3 h-3" />
                              Save
                            </button>
                            <button
                              onClick={cancelRuleEdit}
                              className="flex-1 flex items-center justify-center gap-1 bg-gray-200 text-gray-700 px-3 py-1.5 rounded hover:bg-gray-300 text-sm"
                            >
                              <X className="w-3 h-3" />
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-start gap-3">
                          <input
                            type="checkbox"
                            checked={rule.enabled}
                            onChange={() => toggleRule(rule.id)}
                            className="mt-1"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="text-sm">
                              {rule.type === 'always' ? (
                                <>
                                  <span className="font-medium">Always </span>
                                  <span className="bg-green-100 text-green-800 px-2 py-0.5 rounded text-xs">
                                    (every response)
                                  </span>
                                </>
                              ) : (
                                <>
                                  <span className="font-medium">If response </span>
                                  <span className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded text-xs">
                                    {rule.type.replace('_', ' ')}
                                  </span>
                                  <span className="font-medium truncate"> "{rule.pattern}"</span>
                                </>
                              )}
                            </div>
                            <div className="text-sm mt-2 space-y-1">
                              {(rule.actions || [{ targetAgentId: rule.targetAgentId, message: rule.message, useOriginalPrompt: true }]).map((action, idx) => (
                                <div key={idx} className="flex items-center gap-2">
                                  <span className="text-gray-400 text-xs">{idx + 1}.</span>
                                  <ArrowRight className="w-3 h-3 text-gray-400" />
                                  <span className="text-indigo-600 font-medium">
                                    {agents.find(a => a.id === action.targetAgentId)?.name || 'Unknown'}
                                  </span>
                                  {action.message ? (
                                    <span className="text-gray-600 text-xs truncate">
                                      "{action.message.substring(0, 30)}{action.message.length > 30 ? '...' : ''}"
                                    </span>
                                  ) : (
                                    <span className="text-blue-600 text-xs">
                                      {action.useOriginalPrompt === false ? '[forward response]' : '[forward original prompt]'}
                                    </span>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                          <div className="flex gap-1">
                            <button
                              onClick={() => startEditRule(rule)}
                              className="p-1 hover:bg-blue-100 rounded"
                              title="Edit rule"
                            >
                              <Edit2 className="w-4 h-4 text-blue-600" />
                            </button>
                            <button
                              onClick={() => deleteRule(rule.id)}
                              className="p-1 hover:bg-red-100 rounded"
                              title="Delete rule"
                            >
                              <Trash2 className="w-4 h-4 text-red-600" />
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
              
              <div className="border-t border-gray-200 pt-4">
                <h4 className="font-medium text-sm mb-3">Add New Rule</h4>
                <div className="grid grid-cols-2 gap-3 mb-3">
                  <div>
                    <label className="text-xs text-gray-600 block mb-1">Condition Type</label>
                    <select
                      value={newRuleType}
                      onChange={(e) => setNewRuleType(e.target.value)}
                      className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm"
                    >
                      <option value="always">Always (every response)</option>
                      <option value="contains">Contains</option>
                      <option value="equals">Equals</option>
                      <option value="starts_with">Starts with</option>
                      <option value="ends_with">Ends with</option>
                      <option value="regex">Regex</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-gray-600 block mb-1">Pattern</label>
                    <input
                      type="text"
                      value={newRulePattern}
                      onChange={(e) => setNewRulePattern(e.target.value)}
                      disabled={newRuleType === 'always'}
                      placeholder={newRuleType === 'always' ? 'No pattern needed' : "e.g., 'yes' or 'A'"}
                      className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm disabled:bg-gray-100 disabled:text-gray-500"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="text-xs text-gray-600 block mb-2">Actions (in sequence)</label>
                  <div className="space-y-2">
                    {newRuleActions.map((action, idx) => (
                      <div key={idx} className="flex gap-2 items-start bg-gray-50 p-2 rounded">
                        <span className="text-xs text-gray-500 mt-2">{idx + 1}.</span>
                        <div className="flex-1 space-y-2">
                          <select
                            value={action.targetAgentId}
                            onChange={(e) => {
                              const newActions = [...newRuleActions];
                              newActions[idx].targetAgentId = e.target.value;
                              setNewRuleActions(newActions);
                            }}
                            className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm"
                          >
                            <option value="">Select agent...</option>
                            {agents.map(agent => (
                              <option key={agent.id} value={agent.id}>{agent.name}</option>
                            ))}
                          </select>
                          <div className="space-y-1">
                            <label className="flex items-center text-xs">
                              <input
                                type="radio"
                                name={`new-action-${idx}-type`}
                                checked={!action.message && action.useOriginalPrompt !== false}
                                onChange={() => {
                                  const newActions = [...newRuleActions];
                                  newActions[idx].useOriginalPrompt = true;
                                  newActions[idx].message = '';
                                  setNewRuleActions(newActions);
                                }}
                                className="mr-1"
                              />
                              Forward original prompt (default)
                            </label>
                            <label className="flex items-center text-xs">
                              <input
                                type="radio"
                                name={`new-action-${idx}-type`}
                                checked={!action.message && action.useOriginalPrompt === false}
                                onChange={() => {
                                  const newActions = [...newRuleActions];
                                  newActions[idx].useOriginalPrompt = false;
                                  newActions[idx].message = '';
                                  setNewRuleActions(newActions);
                                }}
                                className="mr-1"
                              />
                              Forward response
                            </label>
                            <label className="flex items-center text-xs">
                              <input
                                type="radio"
                                name={`new-action-${idx}-type`}
                                checked={!!action.message}
                                onChange={() => {
                                  const newActions = [...newRuleActions];
                                  newActions[idx].message = ' '; // Set to space to trigger checked
                                  setNewRuleActions(newActions);
                                }}
                                className="mr-1"
                              />
                              Custom message:
                            </label>
                            {action.message && (
                              <input
                                type="text"
                                value={action.message}
                                onChange={(e) => {
                                  const newActions = [...newRuleActions];
                                  newActions[idx].message = e.target.value;
                                  setNewRuleActions(newActions);
                                }}
                                placeholder="Enter custom message"
                                className="w-full px-2 py-1 border border-gray-300 rounded text-sm ml-4"
                              />
                            )}
                          </div>
                        </div>
                        <button
                          onClick={() => {
                            setNewRuleActions(newRuleActions.filter((_, i) => i !== idx));
                          }}
                          className="p-1 hover:bg-red-100 rounded mt-1"
                          disabled={newRuleActions.length === 1}
                        >
                          <Trash2 className="w-3 h-3 text-red-600" />
                        </button>
                      </div>
                    ))}
                  </div>
                  <button
                    onClick={() => {
                      setNewRuleActions([...newRuleActions, { targetAgentId: '', message: '', useOriginalPrompt: true }]);
                    }}
                    className="mt-2 text-sm text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
                  >
                    <Plus className="w-4 h-4" />
                    Add Action
                  </button>
                </div>
                
                <button
                  onClick={addRule}
                  disabled={(newRuleType !== 'always' && !newRulePattern.trim()) || !newRuleActions.some(a => a.targetAgentId)}
                  className="mt-3 bg-indigo-500 text-white px-4 py-2 rounded hover:bg-indigo-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-sm"
                >
                  Add Rule
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 min-w-0">
          {selectedAgent?.conversations.map((msg, idx) => (
            <div
              key={idx}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-3xl w-full rounded-lg p-4 ${
                  msg.role === 'user'
                    ? 'bg-blue-500 text-white'
                    : 'bg-white border border-gray-200'
                }`}
              >
                {msg.role === 'user' ? (
                  <MarkdownRenderer content={msg.content} isUser={true} />
                ) : (
                  <>
                    <MarkdownRenderer content={msg.content} />
                    {msg.id && (
                      <div className="mt-3 pt-3 border-t border-gray-200">
                        <button
                          onClick={() => forwardMessage(msg.content, msg.id)}
                          className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
                        >
                          <ArrowRight className="w-4 h-4" />
                          {forwardingMessageId === msg.id ? 'Cancel Forward' : 'Forward to Agent'}
                        </button>
                        
                        {forwardingMessageId === msg.id && (
                          <div className="mt-3 space-y-2 bg-gray-50 p-3 rounded">
                            <input
                              type="text"
                              placeholder="Prefix (optional)"
                              value={forwardPrefix}
                              onChange={(e) => setForwardPrefix(e.target.value)}
                              className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                            />
                            <input
                              type="text"
                              placeholder="Postfix (optional)"
                              value={forwardPostfix}
                              onChange={(e) => setForwardPostfix(e.target.value)}
                              className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                            />
                            <div className="flex flex-wrap gap-2 pt-2">
                              {agents
                                .filter(a => a.id !== selectedAgentId)
                                .map(agent => (
                                  <button
                                    key={agent.id}
                                    onClick={() => sendToAgent(agent.id, msg.content)}
                                    className="px-3 py-1.5 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm"
                                  >
                                    Send to {agent.name}
                                  </button>
                                ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <div className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
                  <span className="text-gray-600">Thinking...</span>
                </div>
              </div>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>

        {/* Input Area */}
        <div className="bg-white border-t border-gray-200 p-4">
          <div className="flex gap-2">
            <input
              type="text"
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && !isLoading && sendMessage(userInput)}
              placeholder={`Message ${selectedAgent?.name}...`}
              disabled={isLoading}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
            />
            <button
              onClick={() => sendMessage(userInput)}
              disabled={isLoading || !userInput.trim()}
              className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
            >
              <Send className="w-4 h-4" />
              Send
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}