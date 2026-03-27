package main

import (
  "encoding/json"
  "log"
  "math/rand"
  "net/http"
  "strings"
  "time"
)

type Player struct{ UID, Name, Avatar string }
type Round struct{ ID int64; TS int64; Score int; Desc, UserUID string }
type Room struct{ ID string; Name string; CreatedAt int64; OwnerUid string; Players []Player; RuleId *string; Rounds []Round }
type Rule struct{ ID, Name, Desc, Version string; Preset bool; TemplateMarkdown string }

var rooms = map[string]*Room{}
var rules = map[string]*Rule{}

func jsonResp(w http.ResponseWriter, v any){ w.Header().Set("Content-Type","application/json"); json.NewEncoder(w).Encode(v) }
func notFound(w http.ResponseWriter){ w.WriteHeader(http.StatusNotFound); jsonResp(w, map[string]string{"message":"not found"}) }
func badReq(w http.ResponseWriter, msg string){ w.WriteHeader(http.StatusBadRequest); jsonResp(w, map[string]string{"message":msg}) }

func handleRooms(w http.ResponseWriter, r *http.Request){
  switch r.Method {
  case http.MethodGet:
    list := make([]*Room,0,len(rooms)); for _,v := range rooms { list = append(list, v) }; jsonResp(w, list)
  case http.MethodPost:
    type P struct{ Name, OwnerUid, OwnerName, OwnerAvatar string }
    var p P; if err := json.NewDecoder(r.Body).Decode(&p); err!=nil { badReq(w, "invalid body"); return }
    id := "r-"+randomID(); rm := &Room{ ID:id, Name:p.Name, CreatedAt:time.Now().UnixMilli(), OwnerUid:p.OwnerUid, Players:[]Player{}, Rounds:[]Round{} }
    if p.OwnerUid!="" { rm.Players = append(rm.Players, Player{ UID:p.OwnerUid, Name:p.OwnerName, Avatar:p.OwnerAvatar }) }
    rooms[id] = rm; jsonResp(w, rm)
  default:
    w.WriteHeader(http.StatusMethodNotAllowed)
  }
}

func handleRoom(w http.ResponseWriter, r *http.Request){ id := strings.TrimPrefix(r.URL.Path, "/api/rooms/"); rm, ok := rooms[id]; if !ok { notFound(w); return }
  switch r.Method {
  case http.MethodGet: jsonResp(w, rm)
  case http.MethodPut:
    var upd Room; if err := json.NewDecoder(r.Body).Decode(&upd); err!=nil { badReq(w, "invalid body"); return }
    rm.Name = upd.Name; rm.OwnerUid = upd.OwnerUid; rm.RuleId = upd.RuleId; rm.Players = upd.Players; rm.Rounds = upd.Rounds; jsonResp(w, rm)
  default: w.WriteHeader(http.StatusMethodNotAllowed)
  }
}

func handleJoin(w http.ResponseWriter, r *http.Request){
  if r.Method != http.MethodPost { w.WriteHeader(http.StatusMethodNotAllowed); return }
  parts := strings.Split(strings.TrimPrefix(r.URL.Path, "/api/rooms/"), "/")
  if len(parts)<2 || parts[1] != "join" { notFound(w); return }
  id := parts[0]; rm, ok := rooms[id]; if !ok { notFound(w); return }
  var p Player; if err := json.NewDecoder(r.Body).Decode(&p); err!=nil { badReq(w, "invalid body"); return }
  exists := false; for _,pl := range rm.Players { if pl.UID==p.UID { exists=true; break } }
  if !exists { rm.Players = append(rm.Players, p) }
  jsonResp(w, rm)
}

func handleRules(w http.ResponseWriter, r *http.Request){ switch r.Method { case http.MethodGet: list := make([]*Rule,0,len(rules)); for _,v := range rules { list = append(list, v) }; jsonResp(w, list); case http.MethodPost: var ru Rule; if err := json.NewDecoder(r.Body).Decode(&ru); err!=nil { badReq(w, "invalid body"); return }; if ru.ID=="" { ru.ID = "rule-"+randomID() }; rules[ru.ID] = &ru; jsonResp(w, ru); default: w.WriteHeader(http.StatusMethodNotAllowed) } }
func handleRule(w http.ResponseWriter, r *http.Request){ id := strings.TrimPrefix(r.URL.Path, "/api/rules/"); ru, ok := rules[id]; if !ok { notFound(w); return }; switch r.Method { case http.MethodPut: var upd Rule; if err := json.NewDecoder(r.Body).Decode(&upd); err!=nil { badReq(w, "invalid body"); return }; ru.Name=upd.Name; ru.Desc=upd.Desc; ru.Version=upd.Version; ru.TemplateMarkdown=upd.TemplateMarkdown; jsonResp(w, ru); case http.MethodDelete: if ru.Preset { badReq(w, "preset rule cannot be deleted"); return }; delete(rules, id); jsonResp(w, map[string]bool{"deleted":true}); default: w.WriteHeader(http.StatusMethodNotAllowed) } }

func handleAIScore(w http.ResponseWriter, r *http.Request){ if r.Method!=http.MethodPost { w.WriteHeader(http.StatusMethodNotAllowed); return }; // TODO: proxy Volcengine
  score := rand.Intn(90)+10; jsonResp(w, map[string]any{"score":score, "detail": map[string]any{"mock":true}}) }
func handleAIRuleMarkdown(w http.ResponseWriter, r *http.Request){ if r.Method!=http.MethodPost { w.WriteHeader(http.StatusMethodNotAllowed); return }; type P struct{ Prompt string; Schema any }
  var p P; _ = json.NewDecoder(r.Body).Decode(&p); // TODO: call LLM; now echo prompt in a sectioned markdown
  md := "# 规则\n\n> 变体：川麻 · 版本：v1\n\n## 桌面\n- 人数：4\n- 手牌数：13\n\n## 庄家\n- 连庄：是\n\n## 结算\n- 付费模式：三家付\n\n## 抓鸟\n- 开启：是\n- 数量：2\n\n## 违例检查\n- 查大叫：是\n- 查花猪：是\n\n## 番型\n### 基础番型\n- 平胡：1番\n- 自摸：1番\n\n### 杠类加番\n- 明杠：1番\n- 暗杠：2番\n\n### 额外加成\n- 绝张：1番\n"
  jsonResp(w, map[string]string{"markdown": md}) }

func randomID() string{ return strings.ReplaceAll(time.Now().Format("20060102150405"), " ", "") + ":" +  randomSuffix() }
func randomSuffix() string{ return string([]byte("abcdefghijklmnopqrstuvwxyz")[rand.Intn(26)]) }

func main(){ rand.Seed(time.Now().UnixNano())
  mux := http.NewServeMux()
  mux.HandleFunc("/api/rooms", handleRooms)
  mux.HandleFunc("/api/rooms/", func(w http.ResponseWriter, r *http.Request){ if strings.HasSuffix(r.URL.Path, "/join") { handleJoin(w,r) } else { handleRoom(w,r) } })
  mux.HandleFunc("/api/rules", handleRules)
  mux.HandleFunc("/api/rules/", handleRule)
  mux.HandleFunc("/api/ai/score", handleAIScore)
  mux.HandleFunc("/api/ai/rule-markdown", handleAIRuleMarkdown)
  log.Println("backend listening on :8080")
  log.Fatal(http.ListenAndServe(":8080", mux))
}
