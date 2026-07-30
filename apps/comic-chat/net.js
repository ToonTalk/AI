"use strict";
/* ===========================================================================
   Multiplayer for Web Comic Chat — WebRTC data channels via PeerJS
   (vendored peerjs.min.js, MIT; uses the free public PeerJS broker for
   signalling, then traffic flows peer-to-peer).

   Topology: star. The room creator is the HOST and is authoritative for
   message order — guests send chat to the host, the host appends and
   broadcasts, and everyone (including the sender) renders on receipt. Since
   panel layout is deterministic given the message list, identical order
   means every player sees the identical strip.
   =========================================================================== */

const NET = {
  peer: null,          // my Peer instance
  conns: [],           // host: open connections to guests
  hostConn: null,      // guest: connection to host
  isHost: false,
  roomId: null,
  myName: null,
  participants: [],    // [{name, charId, ai}] — host-maintained, broadcast
  onStatus: null,      // cb(text) for the UI
  onRoster: null       // cb(participants)
};

function netActive(){ return !!(NET.isHost ? NET.peer : NET.hostConn); }
function netAvailable(){ return typeof Peer !== "undefined"; }

function netStatus(text){ if(NET.onStatus) NET.onStatus(text); }

function makeRoomId(){
  const a = "abcdefghjkmnpqrstuvwxyz23456789";
  let s = "cc-";
  for(let i=0;i<6;i++) s += a[Math.floor(Math.random()*a.length)];
  return s;
}

/* ---- host ---- */
function netHost(name, onReady){
  NET.myName = name;
  NET.isHost = true;
  NET.roomId = makeRoomId();
  NET.peer = new Peer(NET.roomId);
  NET.peer.on("open", id=>{
    NET.roomId = id;
    hostRosterChanged();
    netStatus(`Hosting room ${id}`);
    if(onReady) onReady(id);
  });
  NET.peer.on("connection", conn=>{
    conn.on("open", ()=>{
      NET.conns.push(conn);
      conn.send({type:"snapshot", msgs: state.msgs, participants: NET.participants});
    });
    conn.on("data", d=>hostOnData(conn, d));
    const drop = ()=>{
      NET.conns = NET.conns.filter(c=>c!==conn);
      NET.participants = NET.participants.filter(p=>p._conn!==conn);
      hostRosterChanged();
    };
    conn.on("close", drop);
    conn.on("error", drop);
  });
  NET.peer.on("error", e=>netStatus("Network error: " + (e.type||e)));
}
function hostBroadcast(obj, except){
  for(const c of NET.conns) if(c !== except && c.open) c.send(obj);
}
function hostRosterChanged(){
  const roster = NET.participants.map(p=>({name:p.name, charId:p.charId, ai:!!p.ai}));
  const mine = netMyParticipants();
  const all = mine.concat(roster);
  hostBroadcast({type:"roster", participants: all});
  if(NET.onRoster) NET.onRoster(all);
}
function hostOnData(conn, d){
  if(!d || typeof d !== "object") return;
  if(d.type === "hello"){
    NET.participants.push({name:String(d.name||"Player").slice(0,24),
                           charId:d.charId, ai:!!d.ai, _conn:conn});
    hostRosterChanged();
  } else if(d.type === "chat" && d.msg){
    hostAppend(d.msg);
  }
}
function hostAppend(msg){
  applyNetMsg(msg);
  hostBroadcast({type:"append", msg});
}

/* ---- guest ---- */
function netJoin(roomId, name, onReady){
  NET.myName = name;
  NET.isHost = false;
  NET.peer = new Peer();
  NET.peer.on("open", ()=>{
    const conn = NET.peer.connect(roomId, {reliable:true});
    let opened = false;
    conn.on("open", ()=>{
      opened = true;
      NET.hostConn = conn;
      NET.roomId = roomId;
      conn.send({type:"hello", name, charId: curChar, ai:false});
      for(const a of (window.AI_PLAYERS||[]))
        conn.send({type:"hello", name: a.name, charId: a.charId, ai:true});
      netStatus(`In room ${roomId}`);
      if(onReady) onReady(roomId);
    });
    conn.on("data", d=>guestOnData(d));
    const gone = ()=>{ NET.hostConn = null;
      netStatus(opened ? "Host left — the room is closed." : "Could not reach that room."); };
    conn.on("close", gone);
    conn.on("error", gone);
    setTimeout(()=>{ if(!opened) gone(); }, 12000);
  });
  NET.peer.on("error", e=>{
    if(e.type === "peer-unavailable") netStatus("No room with that code.");
    else netStatus("Network error: " + (e.type||e));
  });
}
function guestOnData(d){
  if(!d || typeof d !== "object") return;
  if(d.type === "snapshot"){
    state.msgs = Array.isArray(d.msgs) ? d.msgs : [];
    persist(); renderAll();
    if(NET.onRoster) NET.onRoster(d.participants||[]);
  } else if(d.type === "append" && d.msg){
    applyNetMsg(d.msg);
  } else if(d.type === "roster"){
    if(NET.onRoster) NET.onRoster(d.participants||[]);
  } else if(d.type === "clear"){
    state.msgs = []; persist(); renderAll();
  }
}

/* ---- shared ---- */
function netMyParticipants(){
  const mine = [{name: NET.myName || "Host", charId: curChar, ai:false}];
  for(const a of (window.AI_PLAYERS||[])) mine.push({name:a.name, charId:a.charId, ai:true});
  return mine;
}
/* a locally composed message enters the shared strip through here */
function netDispatch(msg){
  if(NET.isHost){ hostAppend(msg); return true; }
  if(NET.hostConn && NET.hostConn.open){ NET.hostConn.send({type:"chat", msg}); return true; }
  return false;  // not connected — caller applies locally
}
function netClear(){
  if(!NET.isHost) return false;
  state.msgs = []; persist(); renderAll();
  hostBroadcast({type:"clear"});
  return true;
}
function netAnnounceAI(){
  if(NET.isHost) hostRosterChanged();
  else if(NET.hostConn && NET.hostConn.open){
    const a = (window.AI_PLAYERS||[]).slice(-1)[0];
    if(a) NET.hostConn.send({type:"hello", name:a.name, charId:a.charId, ai:true});
  }
}
function netLeave(){
  try{ if(NET.peer) NET.peer.destroy(); }catch(e){}
  NET.peer = null; NET.conns = []; NET.hostConn = null;
  NET.isHost = false; NET.roomId = null; NET.participants = [];
  netStatus("");
  if(NET.onRoster) NET.onRoster([]);
}
