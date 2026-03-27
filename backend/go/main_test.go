package main

import (
  "bytes"
  "encoding/json"
  "io"
  "net/http"
  "net/http/httptest"
  "testing"
)

func newServer() *httptest.Server {
  mux := http.NewServeMux()
  mux.HandleFunc("/api/rooms", handleRooms)
  mux.HandleFunc("/api/rooms/", func(w http.ResponseWriter, r *http.Request){ if r.URL.Path[len(r.URL.Path)-5:] == "/join" { handleJoin(w,r) } else { handleRoom(w,r) } })
  mux.HandleFunc("/api/rules", handleRules)
  mux.HandleFunc("/api/rules/", handleRule)
  mux.HandleFunc("/api/ai/score", handleAIScore)
  mux.HandleFunc("/api/ai/rule-markdown", handleAIRuleMarkdown)
  mux.HandleFunc("/api/score/execute", handleScoreExecute)
  mux.HandleFunc("/api/rules/session/start", handleRuleSessionStart)
  mux.HandleFunc("/api/rules/session/", handleRuleSessionMessage)
  return httptest.NewServer(mux)
}

func httpDo(t *testing.T, method, url string, body any) (*http.Response, []byte) {
  t.Helper()
  var rdr io.Reader
  if body != nil { b, _ := json.Marshal(body); rdr = bytes.NewReader(b) }
  req, _ := http.NewRequest(method, url, rdr)
  req.Header.Set("Content-Type", "application/json")
  resp, err := http.DefaultClient.Do(req)
  if err != nil { t.Fatalf("http error: %v", err) }
  defer resp.Body.Close()
  data, _ := io.ReadAll(resp.Body)
  return resp, data
}

func TestRulesCRUD(t *testing.T){
  srv := newServer(); defer srv.Close()
  // create rule
  r := map[string]any{"name":"自定义规则","templateMarkdown":"# 规则\n\n> 变体：川麻 · 版本：v1\n\n## 桌面\n- 人数：4\n- 手牌数：13\n\n## 庄家\n- 连庄：是\n\n## 结算\n- 付费模式：三家付\n\n## 抓鸟\n- 开启：是\n- 数量：2\n\n## 违例检查\n- 查大叫：是\n- 查花猪：是\n\n## 番型\n### 基础番型\n- 平胡：1番"}
  resp, data := httpDo(t, http.MethodPost, srv.URL+"/api/rules", r)
  if resp.StatusCode != 200 { t.Fatalf("create rule status=%d body=%s", resp.StatusCode, string(data)) }
  var created Rule; _ = json.Unmarshal(data, &created)
  // list
  resp, data = httpDo(t, http.MethodGet, srv.URL+"/api/rules", nil)
  if resp.StatusCode != 200 { t.Fatalf("list rules status=%d", resp.StatusCode) }
  var all []Rule; _ = json.Unmarshal(data, &all)
  if len(all) == 0 { t.Fatalf("expected rules > 0") }
  // delete
  resp, _ = httpDo(t, http.MethodDelete, srv.URL+"/api/rules/"+created.ID, nil)
  if resp.StatusCode != 200 { t.Fatalf("delete rule status=%d", resp.StatusCode) }
  // preset cannot delete
  rules["preset1"] = &Rule{ ID:"preset1", Name:"预置", Preset:true, TemplateMarkdown:"# 规则\n\n## 桌面\n- 人数：4\n## 庄家\n## 结算\n## 抓鸟\n## 违例检查\n## 番型" }
  resp, _ = httpDo(t, http.MethodDelete, srv.URL+"/api/rules/preset1", nil)
  if resp.StatusCode == 200 { t.Fatalf("should not delete preset") }
}

func TestRoomsFlow(t *testing.T){
  srv := newServer(); defer srv.Close()
  // create room with owner
  payload := map[string]string{"name":"测试房间","ownerUid":"u1","ownerName":"房主","ownerAvatar":""}
  resp, data := httpDo(t, http.MethodPost, srv.URL+"/api/rooms", payload)
  if resp.StatusCode != 200 { t.Fatalf("create room status=%d", resp.StatusCode) }
  var rm Room; _ = json.Unmarshal(data, &rm)
  if rm.ID == "" { t.Fatalf("room id empty") }
  // join another player
  resp, _ = httpDo(t, http.MethodPost, srv.URL+"/api/rooms/"+rm.ID+"/join", map[string]string{"uid":"u2","name":"玩家B"})
  if resp.StatusCode != 200 { t.Fatalf("join status=%d", resp.StatusCode) }
  // save a round
  rm.Rounds = append(rm.Rounds, Round{ ID:1, TS:1, Score:12, Desc:"手动", UserUID:"u1" })
  resp, _ = httpDo(t, http.MethodPut, srv.URL+"/api/rooms/"+rm.ID, rm)
  if resp.StatusCode != 200 { t.Fatalf("save status=%d", resp.StatusCode) }
  // fetch detail
  resp, data = httpDo(t, http.MethodGet, srv.URL+"/api/rooms/"+rm.ID, nil)
  if resp.StatusCode != 200 { t.Fatalf("get status=%d", resp.StatusCode) }
  var got Room; _ = json.Unmarshal(data, &got)
  if len(got.Rounds) == 0 { t.Fatalf("expected rounds > 0") }
}

func TestAIEndpoints(t *testing.T){
  srv := newServer(); defer srv.Close()
  // When endpoints not configured, should return 501
  resp, _ := httpDo(t, http.MethodPost, srv.URL+"/api/ai/score", map[string]string{"mock":"x"})
  if resp.StatusCode != http.StatusNotImplemented && resp.StatusCode != http.StatusOK { t.Fatalf("ai score status=%d", resp.StatusCode) }
  resp, _ = httpDo(t, http.MethodPost, srv.URL+"/api/ai/rule-markdown", map[string]string{"prompt":"四人血战到底"})
  if resp.StatusCode != http.StatusNotImplemented && resp.StatusCode != http.StatusOK { t.Fatalf("ai rule md status=%d", resp.StatusCode) }
  // execute scoring placeholder
  resp, data := httpDo(t, http.MethodPost, srv.URL+"/api/score/execute", map[string]any{"input": map[string]any{"tiles": []any{1,2,3}}})
  if resp.StatusCode != http.StatusOK { t.Fatalf("score exec status=%d", resp.StatusCode) }
  var s map[string]any; _ = json.Unmarshal(data, &s); if _, ok := s["score"]; !ok { t.Fatalf("score missing") }
  // sessions
  resp, _ = httpDo(t, http.MethodPost, srv.URL+"/api/rules/session/start", map[string]string{"prompt":"规则"})
  if resp.StatusCode != http.StatusNotImplemented && resp.StatusCode != http.StatusOK { t.Fatalf("session start status=%d", resp.StatusCode) }
}
