# IP Reputation Checker — Kubernetes Microservices

A compact, production-like **microservices** app you can deploy on **Kubernetes**.  
It includes a browser UI, two backend services, an auth service backed by **MongoDB**, and persistent storage.

---

## Repository Layout(key files)

```
/analysis-service
/api-service
/auth-service
/frontend-web
/kubernetes
  ├─ 00-namespace.yaml
  ├─ 10-mongodb.yaml
  ├─ 20-auth.yaml
  ├─ 30-api.yaml
  ├─ 40-analysis.yaml
  └─ 50-frontend.yaml
README.md
```


**Microservices**
- `frontend-web` — NGINX static site (HTML/JS). *Exposed via NodePort for your browser.*
- `api-service` — Python **FastAPI**; the external REST gateway used by the UI.
- `analysis-service` — Node.js **Express**; looks up/derives “IP reputation”.
- `auth-service` — Python **FastAPI**; simple register/login API using MongoDB.
- `mongodb` — **Mongo 6**; user store with **PersistentVolumeClaim (PVC)**.

All services are reachable in-cluster; **frontend** is exposed to your machine for the UI.

---

## Architecture

```
                +-----------------------+
  Browser  ---> |  frontend-web (UI)    |   (NodePort :30080)
                +-----------+-----------+
                            |
                            v
                  +---------+---------+             +------------------+
                  |  api-service      |  ----->     | analysis-service |
                  |  (FastAPI)        |   REST      |  (Express)       |
                  +---------+---------+             +------------------+
                            |
                            v
                  +---------+---------+
                  |  auth-service      |  <---->  MongoDB (mongo:6, PVC)
                  |  (FastAPI)         |
                  +--------------------+
```

**Patterns used**
- API Gateway (**api-service**) in front of backend services.
- Stateless microservices (easy to **scale** independently).
- Database-per-service (auth owns MongoDB).
- **Persistent** storage (PVC) for Mongo across pod restarts.
- External access via **NodePort** (no extra ingress needed).

---

## Public Images

- `ntvs28/ip-reputation-checker-frontend-web:v1`
- `ntvs28/ip-reputation-checker-api-service:v1`
- `ntvs28/ip-reputation-checker-analysis-service:v1`
- `ntvs28/ip-reputation-checker-auth-service:v1`
- `mongo:6`

---

## Prerequisites

**Windows (preferred for grading):**
- Docker Desktop with **Kubernetes enabled** (Settings ▸ Kubernetes ▸ *Enable Kubernetes*)
- `kubectl` in PATH (Docker Desktop provides one)
- PowerShell or CMD

**macOS (alternative):**
- Docker Desktop (or any Docker daemon)
- `minikube` + `kubectl`

> **Tip:** Do not run any `kubectl apply -f .` from the repository root. Apply only the files in the `kubernetes/` folder.

---

## Quick Start — Windows (Docker Desktop Kubernetes)

From the project root **where the `kubernetes` folder is**:

```powershell
# 1) Select Docker Desktop's cluster
kubectl config use-context docker-desktop
kubectl get nodes

# 2) Apply manifests
kubectl apply -f .\kubernetes\00-namespace.yaml
kubectl apply -f .\kubernetes\10-mongodb.yaml
kubectl apply -f .\kubernetes\20-auth.yaml
kubectl apply -f .\kubernetes\30-api.yaml
kubectl apply -f .\kubernetes\40-analysis.yaml
kubectl apply -f .\kubernetes\50-frontend.yaml

# 3) (Safety) Ensure images reference public Docker Hub tags
kubectl -n ip-reputation set image deploy/auth-service     auth-service=ntvs28/ip-reputation-checker-auth-service:v3-20250927203821
kubectl -n ip-reputation set image deploy/api-service      api-service=ntvs28/ip-reputation-checker-api-service:v-api-20250927174753
kubectl -n ip-reputation set image deploy/analysis-service analysis-service=ntvs28/ip-reputation-checker-analysis-service:v1
kubectl -n ip-reputation set image deploy/frontend-web     frontend=ntvs28/ip-reputation-checker-frontend-web:v-ui-20250927205653

# 4) Wait for pods to be Ready
kubectl -n ip-reputation wait --for=condition=available deploy --all --timeout=300s
kubectl -n ip-reputation get pods -o wide

# 5) UI NodePort (usually 30080)
kubectl -n ip-reputation get svc frontend-web -o jsonpath="{.spec.ports[0].nodePort}{'\n'}"

# 6) Open the app (Windows minikube with Docker driver)
minikube service frontend-web -n ip-reputation
# Alternative: Get the URL and open manually
# minikube service frontend-web -n ip-reputation --url
```

---

## Quick Start — macOS (minikube)

```bash
# 1) Start minikube (Docker driver)
minikube start

# 2) Apply manifests
kubectl apply -f kubernetes/00-namespace.yaml
kubectl apply -f kubernetes/10-mongodb.yaml
kubectl apply -f kubernetes/20-auth.yaml
kubectl apply -f kubernetes/30-api.yaml
kubectl apply -f kubernetes/40-analysis.yaml
kubectl apply -f kubernetes/50-frontend.yaml

# 3) Wait
kubectl -n ip-reputation wait --for=condition=available deploy --all --timeout=300s

# 4) Get a URL for the NodePort service
minikube service frontend-web -n ip-reputation --url
# (or)
kubectl -n ip-reputation port-forward svc/frontend-web 8080:80
open http://127.0.0.1:8080
```

> **Apple Silicon (arm64):** If you see `ImagePullBackOff` due to architecture, enable Docker’s amd64 emulation (Rosetta) *or* rebuild multi-arch images. (Pre‑built images above are intended to work out‑of‑the‑box.)

---

## Verify & Demo Commands

**Health + IP reputation:**

```powershell
curl.exe -i http://127.0.0.1:30080/api/health
curl.exe -i http://127.0.0.1:30080/api/check-ip/1.1.1.1
```

**Register + Login:**

```powershell
$u = "demo$((Get-Random))"
$body = @{ username = $u; password = "demo123" } | ConvertTo-Json

Invoke-RestMethod -Method POST -Uri http://127.0.0.1:30080/auth/register -ContentType 'application/json' -Body $body
Invoke-RestMethod -Method POST -Uri http://127.0.0.1:30080/auth/login    -ContentType 'application/json' -Body $body
```

---

## Scale Out (Horizontal Scalability)

```powershell
kubectl -n ip-reputation scale deploy/analysis-service --replicas=3
kubectl -n ip-reputation get pods -l app=analysis-service -o wide
```

Each microservice can be scaled independently (same command, different deployment name).

---

## Persistence Check (Mongo PVC)

```powershell
kubectl -n ip-reputation get pvc
```

You should see `mongodb-pvc` in **Bound** state (e.g., `1Gi`, `hostpath`).

---

## Troubleshooting

- **NodePort 30080 already allocated (macOS/minikube):**  
  Pick another NodePort (e.g., 31080):
  ```bash
  kubectl -n ip-reputation patch svc/frontend-web \
    -p '{"spec":{"ports":[{"port":80,"targetPort":80,"nodePort":31080}],"type":"NodePort"}}'
  minikube service frontend-web -n ip-reputation --url
  ```

- **Pods stuck `ImagePullBackOff`:**  
  Make sure you can pull the public images (see *Public Images*). On arm64 Macs, enable amd64 emulation **or** rebuild multi‑arch images.

- **Namespace stuck Terminating:**  
  ```powershell
  kubectl get ns ip-reputation -o json | jq '.spec' # inspect finalizers if needed
  # Usually deleting all resources first and re-applying resolves it:
  kubectl delete ns ip-reputation
  kubectl apply -f kubernetes/00-namespace.yaml
  ```

- **Windows: curl `$BASE` errors**  
  Use **literal URLs** as shown above (e.g., `http://127.0.0.1:30080/...`) unless you've set `$BASE` yourself.

- **Windows minikube with Docker driver: Connection refused**  
  Use `minikube service frontend-web -n ip-reputation` instead of direct localhost access.  
  The minikube service command will automatically open the correct URL in your browser.



**Enjoy!** Open a PR or issue if you want improvements or extra polish.
