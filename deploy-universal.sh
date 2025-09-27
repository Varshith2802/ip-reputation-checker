#!/bin/bash

echo "🚀 Deploying IP Reputation Checker (Universal - Windows & macOS)..."

# 1) Check if minikube is running
echo "📋 Checking minikube status..."
minikube status

# 2) Clean up any existing deployment
echo "🧹 Cleaning up any existing deployment..."
kubectl delete namespace ip-reputation --ignore-not-found=true

# 3) Apply manifests (universal)
echo "📦 Applying Kubernetes manifests..."
kubectl apply -f kubernetes/00-namespace.yaml
kubectl apply -f kubernetes/10-mongodb.yaml
kubectl apply -f kubernetes/20-auth.yaml
kubectl apply -f kubernetes/30-api.yaml
kubectl apply -f kubernetes/40-analysis.yaml
kubectl apply -f kubernetes/50-frontend.yaml

# 4) Update images to public Docker Hub tags
echo "🔄 Updating to public Docker Hub images..."
kubectl -n ip-reputation set image deploy/auth-service auth-service=ntvs28/ip-reputation-checker-auth-service:v3-20250927203821
kubectl -n ip-reputation set image deploy/api-service api-service=ntvs28/ip-reputation-checker-api-service:v-api-20250927174753
kubectl -n ip-reputation set image deploy/analysis-service analysis-service=ntvs28/ip-reputation-checker-analysis-service:v1
kubectl -n ip-reputation set image deploy/frontend-web frontend=ntvs28/ip-reputation-checker-frontend-web:v-ui-20250927205653

# 5) Wait for deployments to be ready
echo "⏳ Waiting for deployments to be ready..."
kubectl -n ip-reputation wait --for=condition=available deploy --all --timeout=300s

# 6) Check pod status
echo "📊 Checking pod status..."
kubectl -n ip-reputation get pods -o wide

# 7) Get service URL
echo "🌐 Getting service URL..."
kubectl -n ip-reputation get svc frontend-web -o jsonpath="{.spec.ports[0].nodePort}{'\n'}"

# 8) Open the application
echo "🎉 Opening application in browser..."
minikube service frontend-web -n ip-reputation

echo "✅ Deployment complete! Application should be opening in your browser."
echo "📝 If the browser doesn't open automatically, run:"
echo "   minikube service frontend-web -n ip-reputation --url"
