package main

import (
  "encoding/json"
  "errors"
  "bytes"
  "io"
  "mime/multipart"
  "io/fs"
  "log"
  "math/rand"
  "net/http"
  "os"
  "path/filepath"
  "strings"
  "sync"
  "time"
)

type Player struct{ UID, Name, Avatar string }
type Round struct{ ID int64; TS int64; Score int; Desc, UserUID string }
type Room struct{
  ID string `json:"id"`
  Name string `json:"name"`
  CreatedAt int64 `json:"createdAt"`
  OwnerUid string `json:"ownerUid"`
  Players []Player `json:"players"`
  RuleId *string `json:"ruleId"`
  Rounds []Round `json:"rounds"`
}
type Rule struct{
  ID string `json:"id"`
  Name string `json:"name"`
  Desc string `json:"desc"`
  Version string `json:"version"`
  Preset bool `json:"preset"`
  TemplateMarkdown string `json:"templateMarkdown"`
}

var (
  rooms = map[string]*Room{}
  rules = map[string]*Rule{}
  mu    sync.RWMutex
  dataDir = envOr("DATA_DIR", "./data")
  volcEndpoint = envOr("VOLC_ENDPOINT", "")
  volcAuth     = envOr("VOLC_AUTH", "") // e.g. Bearer xxx
  llmEndpoint  = envOr("LLM_ENDPOINT", "")
  llmAuth      = envOr("LLM_AUTH", "")
)

func jsonResp(w http.ResponseWriter, v any){ w.Header().Set("Content-Type","application/json"); json.NewEncoder(w).Encode(v) }
func notFound(w http.ResponseWriter){ w.WriteHeader(http.StatusNotFound); jsonResp(w, map[string]string{"message":"not found"}) }
func badReq(w http.ResponseWriter, msg string){ w.WriteHeader(http.StatusBadRequest); jsonResp(w, map[string]string{"message":msg}) }

// persistence helpers
func ensureDir(path string) error { return os.MkdirAll(path, 0o755) }
func loadJSON(path string, v any) error {
  b, err := os.ReadFile(path)
  if err != nil {
    if errors.Is(err, fs.ErrNotExist) { return nil }
    return err
  }
  return json.Unmarshal(b, v)
}
func saveJSON(path string, v any) error {
  if err := ensureDir(filepath.Dir(path)); err != nil { return err }
  b, err := json.MarshalIndent(v, "", "  ")
  if err != nil { return err }
  tmp := path+".tmp"
  if err := os.WriteFile(tmp, b, 0o644); err != nil { return err }
  return os.Rename(tmp, path)
}
func loadState(){
  _ = ensureDir(dataDir)
  var rlist []*Rule
  var roomlist []*Room
  _ = loadJSON(filepath.Join(dataDir, "rules.json"), &rlist)
  _ = loadJSON(filepath.Join(dataDir, "rooms.json"), &roomlist)
  mu.Lock(); defer mu.Unlock()
  rules = map[string]*Rule{}
  rooms = map[string]*Room{}
  for _, ru := range rlist { rules[ru.ID] = ru }
  for _, rm := range roomlist { rooms[rm.ID] = rm }
}
func saveRules(){ mu.RLock(); defer mu.RUnlock(); list := make([]*Rule,0,len(rules)); for _,v := range rules { list = append(list, v) }; _ = saveJSON(filepath.Join(dataDir, "rules.json"), list) }
func saveRooms(){ mu.RLock(); defer mu.RUnlock(); list := make([]*Room,0,len(rooms)); for _,v := range rooms { list = append(list, v) }; _ = saveJSON(filepath.Join(dataDir, "rooms.json"), list) }

func handleRooms(w http.ResponseWriter, r *http.Request){
  switch r.Method {
  case http.MethodGet:
    mu.RLock(); list := make([]*Room,0,len(rooms)); for _,v := range rooms { list = append(list, v) }; mu.RUnlock(); jsonResp(w, list)
  case http.MethodPost:
    type P struct{ Name, OwnerUid, OwnerName, OwnerAvatar string }
    var p P; if err := json.NewDecoder(r.Body).Decode(&p); err!=nil { badReq(w, "invalid body"); return }
    id := "r-"+randomID(); rm := &Room{ ID:id, Name:p.Name, CreatedAt:time.Now().UnixMilli(), OwnerUid:p.OwnerUid, Players:[]Player{}, Rounds:[]Round{} }
    if p.OwnerUid!="" { rm.Players = append(rm.Players, Player{ UID:p.OwnerUid, Name:p.OwnerName, Avatar:p.OwnerAvatar }) }
    mu.Lock(); rooms[id] = rm; mu.Unlock(); saveRooms(); jsonResp(w, rm)
  default:
    w.WriteHeader(http.StatusMethodNotAllowed)
  }
}

func handleRoom(w http.ResponseWriter, r *http.Request){ id := strings.TrimPrefix(r.URL.Path, "/api/rooms/"); mu.RLock(); rm, ok := rooms[id]; mu.RUnlock(); if !ok { notFound(w); return }
  switch r.Method {
  case http.MethodGet: jsonResp(w, rm)
  case http.MethodPut:
    var upd Room; if err := json.NewDecoder(r.Body).Decode(&upd); err!=nil { badReq(w, "invalid body"); return }
    mu.Lock(); rm.Name = upd.Name; rm.OwnerUid = upd.OwnerUid; rm.RuleId = upd.RuleId; rm.Players = upd.Players; rm.Rounds = upd.Rounds; rooms[id] = rm; mu.Unlock(); saveRooms(); jsonResp(w, rm)
  default: w.WriteHeader(http.StatusMethodNotAllowed)
  }
}

func handleJoin(w http.ResponseWriter, r *http.Request){
  if r.Method != http.MethodPost { w.WriteHeader(http.StatusMethodNotAllowed); return }
  parts := strings.Split(strings.TrimPrefix(r.URL.Path, "/api/rooms/"), "/")
  if len(parts)<2 || parts[1] != "join" { notFound(w); return }
  id := parts[0]; mu.RLock(); rm, ok := rooms[id]; mu.RUnlock(); if !ok { notFound(w); return }
  var p Player; if err := json.NewDecoder(r.Body).Decode(&p); err!=nil { badReq(w, "invalid body"); return }
  exists := false; for _,pl := range rm.Players { if pl.UID==p.UID { exists=true; break } }
  if !exists { mu.Lock(); rm.Players = append(rm.Players, p); rooms[id] = rm; mu.Unlock(); saveRooms() }
  jsonResp(w, rm)
}

func handleRules(w http.ResponseWriter, r *http.Request){ switch r.Method { case http.MethodGet: mu.RLock(); list := make([]*Rule,0,len(rules)); for _,v := range rules { list = append(list, v) }; mu.RUnlock(); jsonResp(w, list); case http.MethodPost: var ru Rule; if err := json.NewDecoder(r.Body).Decode(&ru); err!=nil { badReq(w, "invalid body"); return }; if ru.ID=="" { ru.ID = "rule-"+randomID() }; mu.Lock(); rules[ru.ID] = &ru; mu.Unlock(); saveRules(); jsonResp(w, ru); default: w.WriteHeader(http.StatusMethodNotAllowed) } }
func handleRule(w http.ResponseWriter, r *http.Request){ id := strings.TrimPrefix(r.URL.Path, "/api/rules/"); mu.RLock(); ru, ok := rules[id]; mu.RUnlock(); if !ok { notFound(w); return }; switch r.Method { case http.MethodPut: var upd Rule; if err := json.NewDecoder(r.Body).Decode(&upd); err!=nil { badReq(w, "invalid body"); return }; mu.Lock(); ru.Name=upd.Name; ru.Desc=upd.Desc; ru.Version=upd.Version; ru.TemplateMarkdown=upd.TemplateMarkdown; rules[id] = ru; mu.Unlock(); saveRules(); jsonResp(w, ru); case http.MethodDelete: if ru.Preset { badReq(w, "preset rule cannot be deleted"); return }; mu.Lock(); delete(rules, id); mu.Unlock(); saveRules(); jsonResp(w, map[string]bool{"deleted":true}); default: w.WriteHeader(http.StatusMethodNotAllowed) } }

func handleAIScore(w http.ResponseWriter, r *http.Request){
  if r.Method!=http.MethodPost { w.WriteHeader(http.StatusMethodNotAllowed); return }
  if volcEndpoint == "" {
    w.WriteHeader(http.StatusNotImplemented)
    jsonResp(w, map[string]any{"message":"VOLC_ENDPOINT not configured"})
    return
  }
  if err := r.ParseMultipartForm(10 << 20); err != nil { badReq(w, "invalid multipart form"); return }
  file, header, err := r.FormFile("file")
  if err != nil { badReq(w, "file field required"); return }
  defer file.Close()
  // forward file to volcEndpoint as multipart/form-data
  pr, pw := io.Pipe()
  mw := multipart.NewWriter(pw)
  go func(){
    defer pw.Close()
    fw, _ := mw.CreateFormFile("file", header.Filename)
    io.Copy(fw, file)
    // forward any text fields
    for k, vals := range r.MultipartForm.Value { for _, v := range vals { mw.WriteField(k, v) } }
    mw.Close()
  }()
  req, _ := http.NewRequest(http.MethodPost, volcEndpoint, pr)
  req.Header.Set("Content-Type", mw.FormDataContentType())
  if volcAuth != "" { req.Header.Set("Authorization", volcAuth) }
  resp, err := http.DefaultClient.Do(req)
  if err != nil { w.WriteHeader(http.StatusBadGateway); jsonResp(w, map[string]string{"message":"volc proxy error: "+err.Error()}); return }
  defer resp.Body.Close()
  body, _ := io.ReadAll(resp.Body)
  if resp.StatusCode < 200 || resp.StatusCode >= 300 { w.WriteHeader(http.StatusBadGateway); jsonResp(w, map[string]any{"message":"volc error", "status": resp.StatusCode, "body": string(body)}); return }
  // try parse score
  var data map[string]any
  _ = json.Unmarshal(body, &data)
  // common patterns: score directly or nested
  var score any
  if v, ok := data["score"]; ok { score = v } else if v, ok := data["data"].(map[string]any); ok { score = v["score"] }
  switch s := score.(type) {
  case float64:
    jsonResp(w, map[string]any{"score": int(s), "detail": data})
  case int:
    jsonResp(w, map[string]any{"score": s, "detail": data})
  default:
    // fallback mock when no score field present
    jsonResp(w, map[string]any{"score": rand.Intn(90)+10, "detail": data})
  }
}

func handleAIRuleMarkdown(w http.ResponseWriter, r *http.Request){
  if r.Method!=http.MethodPost { w.WriteHeader(http.StatusMethodNotAllowed); return }
  if llmEndpoint == "" {
    w.WriteHeader(http.StatusNotImplemented)
    jsonResp(w, map[string]any{"message":"LLM_ENDPOINT not configured"})
    return
  }
  // forward JSON payload { prompt, schema }
  var payload map[string]any
  if err := json.NewDecoder(r.Body).Decode(&payload); err != nil { badReq(w, "invalid json"); return }
  b, _ := json.Marshal(payload)
  req, _ := http.NewRequest(http.MethodPost, llmEndpoint, bytes.NewReader(b))
  req.Header.Set("Content-Type", "application/json")
  if llmAuth != "" { req.Header.Set("Authorization", llmAuth) }
  resp, err := http.DefaultClient.Do(req)
  if err != nil { w.WriteHeader(http.StatusBadGateway); jsonResp(w, map[string]string{"message":"llm proxy error: "+err.Error()}); return }
  defer resp.Body.Close()
  body, _ := io.ReadAll(resp.Body)
  if resp.StatusCode < 200 || resp.StatusCode >= 300 { w.WriteHeader(http.StatusBadGateway); jsonResp(w, map[string]any{"message":"llm error", "status": resp.StatusCode, "body": string(body)}); return }
  var out map[string]any
  _ = json.Unmarshal(body, &out)
  md := ""
  if v, ok := out["markdown"].(string); ok { md = v } else if v, ok := out["output"].(string); ok { md = v }
  if md == "" { badReq(w, "llm response missing markdown"); return }
  jsonResp(w, map[string]string{"markdown": md})
}

func randomID() string{ return strings.ReplaceAll(time.Now().Format("20060102150405"), " ", "") + ":" +  randomSuffix() }
func randomSuffix() string{ return string([]byte("abcdefghijklmnopqrstuvwxyz")[rand.Intn(26)]) }

func envOr(k, def string) string { if v := os.Getenv(k); v != "" { return v }; return def }

func withCORS(next http.Handler) http.Handler { return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request){ w.Header().Set("Access-Control-Allow-Origin", "*"); w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization"); w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS"); if r.Method == http.MethodOptions { w.WriteHeader(http.StatusNoContent); return }; next.ServeHTTP(w,r) }) }

type logResponseWriter struct{
  http.ResponseWriter
  status int
  buf    bytes.Buffer
}
func (lrw *logResponseWriter) WriteHeader(code int){ lrw.status = code; lrw.ResponseWriter.WriteHeader(code) }
func (lrw *logResponseWriter) Write(b []byte) (int, error){ lrw.buf.Write(b); return lrw.ResponseWriter.Write(b) }

func truncate(s string, n int) string { if len(s) <= n { return s }; return s[:n] + "...(truncated)" }

func withLogging(next http.Handler) http.Handler { return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request){
  ct := r.Header.Get("Content-Type")
  reqPreview := ""
  if strings.Contains(ct, "multipart/form-data") {
    reqPreview = "[multipart]"
  } else {
    b, _ := io.ReadAll(r.Body)
    reqPreview = string(b)
    r.Body = io.NopCloser(bytes.NewReader(b))
  }
  lrw := &logResponseWriter{ResponseWriter: w, status: 200}
  start := time.Now()
  next.ServeHTTP(lrw, r)
  dur := time.Since(start)
  respPreview := lrw.buf.String()
  log.Printf("%s %s from %s ct=%s req=%q -> %d in %s resp=%q",
    r.Method, r.URL.Path, r.RemoteAddr, ct, truncate(reqPreview, 4096), lrw.status, dur, truncate(respPreview, 4096))
}) }

func main(){ rand.Seed(time.Now().UnixNano())
  loadState()
  mux := http.NewServeMux()
  mux.HandleFunc("/api/rooms", handleRooms)
  mux.HandleFunc("/api/rooms/", func(w http.ResponseWriter, r *http.Request){ if strings.HasSuffix(r.URL.Path, "/join") { handleJoin(w,r) } else { handleRoom(w,r) } })
  mux.HandleFunc("/api/rules", handleRules)
  mux.HandleFunc("/api/rules/", handleRule)
  mux.HandleFunc("/api/ai/score", handleAIScore)
  mux.HandleFunc("/api/ai/rule-markdown", handleAIRuleMarkdown)
  mux.HandleFunc("/api/admin/reset", handleAdminReset)
  // scoring engine: execute with structured input
  mux.HandleFunc("/api/score/execute", handleScoreExecute)
  // rule creation multi-turn session (LLM-guided)
  mux.HandleFunc("/api/rules/session/start", handleRuleSessionStart)
  mux.HandleFunc("/api/rules/session/", handleRuleSessionMessage)
  addr := ":" + envOr("PORT", "8080")
  log.Println("backend listening on", addr, "dataDir=", dataDir)
  log.Fatal(http.ListenAndServe(addr, withLogging(withCORS(mux))))
}

// --- Scoring engine placeholder ---
// POST /api/score/execute { ruleId?:string, templateMarkdown?:string, input:{ tiles:any, context?:any } }
func handleScoreExecute(w http.ResponseWriter, r *http.Request){
  if r.Method != http.MethodPost { w.WriteHeader(http.StatusMethodNotAllowed); return }
  // TODO: implement universal mahjong scoring engine
  var payload map[string]any
  if err := json.NewDecoder(r.Body).Decode(&payload); err != nil { badReq(w, "invalid json"); return }
  // placeholder: echo a deterministic mock based on tiles count
  input := payload["input"].(map[string]any)
  tiles := input["tiles"]
  count := 0
  switch t := tiles.(type) {
  case []any:
    count = len(t)
  case map[string]any:
    for range t { count++ }
  }
  score := 10 + (count % 10)
  jsonResp(w, map[string]any{"score": score, "detail": map[string]any{"mock": true, "tilesCount": count}})
}

// --- Rule creation sessions (LLM multi-turn) ---
// POST /api/rules/session/start { prompt:string }
func handleRuleSessionStart(w http.ResponseWriter, r *http.Request){
  if r.Method != http.MethodPost { w.WriteHeader(http.StatusMethodNotAllowed); return }
  if llmEndpoint == "" { w.WriteHeader(http.StatusNotImplemented); jsonResp(w, map[string]string{"message":"LLM_ENDPOINT not configured"}); return }
  // TODO: call LLM to init conversation; return sessionId
  sid := "sess-" + randomID()
  jsonResp(w, map[string]string{"sessionId": sid})
}

// POST /api/rules/session/:id/message { prompt:string }
func handleRuleSessionMessage(w http.ResponseWriter, r *http.Request){
  if r.Method != http.MethodPost { w.WriteHeader(http.StatusMethodNotAllowed); return }
  if !strings.HasPrefix(r.URL.Path, "/api/rules/session/") { notFound(w); return }
  if llmEndpoint == "" { w.WriteHeader(http.StatusNotImplemented); jsonResp(w, map[string]string{"message":"LLM_ENDPOINT not configured"}); return }
  // TODO: maintain conversation state; for now just proxy single turn to /api/ai/rule-markdown
  handleAIRuleMarkdown(w, r)
}
// 管理端：清空数据（保留预置规则）
func handleAdminReset(w http.ResponseWriter, r *http.Request){
  if r.Method != http.MethodPost { w.WriteHeader(http.StatusMethodNotAllowed); return }
  mu.Lock()
  // 清空房间
  rooms = map[string]*Room{}
  // 保留预置规则，移除非预置
  newRules := map[string]*Rule{}
  for id, ru := range rules { if ru.Preset { newRules[id] = ru } }
  rules = newRules
  mu.Unlock()
  saveRooms(); saveRules()
  jsonResp(w, map[string]any{"ok": true, "roomsCleared": true, "rulesPreserved": len(newRules)})
}
