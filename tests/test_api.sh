#!/bin/bash

# Base URL of your API
BASE_URL="http://localhost:3000"

# Function to check if jq is installed
check_jq() {
    if ! command -v jq &> /dev/null; then
        echo "jq is not installed. Please install it to parse JSON responses."
        exit 1
    fi
}

# Function to wait for job completion
wait_for_job() {
    local job_id=$1
    local status="waiting"
    while [ "$status" != "completed" ]; do
        sleep 5
        response=$(curl -s "$BASE_URL/download/$job_id")
        status=$(echo $response | jq -r '.state')
        echo "Job status: $status"
        if [ "$status" == "failed" ]; then
            echo "Job failed"
            exit 1
        fi
    done
}

# Check if jq is installed
check_jq

# 1. Queue a video download
echo "Queueing video download..."
response=$(curl -s -X POST "$BASE_URL/download" \
     -H "Content-Type: application/json" \
     -d '{"videoUrl": "https://www.youtube.com/watch?v=oBwgts95YSg"}')
job_id=$(echo $response | jq -r '.jobId')
echo "Job ID: $job_id"

# 2. Wait for the download to complete
echo "Waiting for download to complete..."
wait_for_job $job_id

# 3. Get job details
echo "Getting job details..."
curl -s "$BASE_URL/download/$job_id" | jq .

# 4. List all videos
echo "Listing all videos..."
videos=$(curl -s "$BASE_URL/videos" | jq .)
echo "$videos"

# Extract the filename of the downloaded video
filename=$(echo "$videos" | jq -r '.[0].name')
echo "Downloaded video filename: $filename"

# 5. Delete the downloaded video
# echo "Deleting the downloaded video..."
# curl -s -X DELETE "$BASE_URL/videos/$filename" | jq .

# 6. List videos again to confirm deletion
# echo "Listing videos after deletion..."
# curl -s "$BASE_URL/videos" | jq .

echo "API flow test completed."