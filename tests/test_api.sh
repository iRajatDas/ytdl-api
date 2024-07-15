# #!/bin/bash

# # Base URL of your API
# BASE_URL="http://localhost:3000"

# # Function to check if jq is installed
# check_jq() {
#     if ! command -v jq &> /dev/null; then
#         echo "jq is not installed. Please install it to parse JSON responses."
#         exit 1
#     fi
# }

# # Function to wait for job completion
# wait_for_job() {
#     local job_id=$1
#     local status="waiting"
#     while [ "$status" != "completed" ]; do
#         sleep 5
#         response=$(curl -s "$BASE_URL/download/$job_id")
#         status=$(echo $response | jq -r '.state')
#         echo "Job status: $status"
#         if [ "$status" == "failed" ]; then
#             echo "Job failed"
#             exit 1
#         fi
#         if [ "$status" == "in-progress" ]; then
#             echo "Job in progress..."
#         fi
#     done
# }

# # Check if jq is installed
# check_jq

# # 1. Queue a video download
# echo "Queueing video download..."
# response=$(curl -s -X POST "$BASE_URL/download" \
#      -H "Content-Type: application/json" \
#      -d '{"videoUrl": "https://www.youtube.com/watch?v=3SnOmNwqgLc"}')
# job_id=$(echo $response | jq -r '.jobId')
# echo "Job ID: $job_id"

# # 2. Wait for the download to complete
# echo "Waiting for download to complete..."
# wait_for_job $job_id

# # 3. Get job details
# echo "Getting job details..."
# job_details=$(curl -s "$BASE_URL/download/$job_id" | jq .)
# echo "$job_details"

# # Extract the filename from job details
# filename=$(echo "$job_details" | jq -r '.result.fileName')
# echo "Downloaded video filename: $filename"

# # 4. List all videos
# echo "Listing all videos..."
# videos=$(curl -s "$BASE_URL/videos" | jq .)
# echo "$videos"

# # 5. Delete the downloaded video (uncomment to test deletion)
# # if [ -n "$filename" ]; then
# #     echo "Deleting the downloaded video..."
# #     delete_response=$(curl -s -X DELETE "$BASE_URL/videos/$filename")
# #     delete_status=$(echo $delete_response | jq -r '.status')
# #     if [ "$delete_status" == "success" ]; then
# #         echo "Video deleted successfully"
# #     else
# #         echo "Failed to delete video"
# #     fi
# # else
# #     echo "No filename found to delete"
# # fi

# # # 6. List videos again to confirm deletion (uncomment to test deletion)
# # echo "Listing videos after deletion..."
# # videos_after_deletion=$(curl -s "$BASE_URL/videos" | jq .)
# # echo "$videos_after_deletion"

# echo "API flow test completed."


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
        if [ "$status" == "in-progress" ]; then
            echo "Job in progress..."
        fi
    done
}

# Check if jq is installed
check_jq

# Array of video qualities to test
qualities=("320p" "480p" "720p" "1080p")

for quality in "${qualities[@]}"; do
    # 1. Queue a video download
    echo "Queueing video download for quality $quality..."
    response=$(curl -s -X POST "$BASE_URL/download" \
         -H "Content-Type: application/json" \
         -d "{\"videoUrl\": \"https://www.youtube.com/watch?v=aBvcg66gENc\", \"quality\": \"$quality\"}")
    job_id=$(echo $response | jq -r '.jobId')
    echo "Job ID: $job_id"

    # 2. Wait for the download to complete
    echo "Waiting for download to complete..."
    wait_for_job $job_id

    # 3. Get job details
    echo "Getting job details for quality $quality..."
    job_details=$(curl -s "$BASE_URL/download/$job_id" | jq .)
    echo "$job_details"

    # Extract the filename from job details
    filename=$(echo "$job_details" | jq -r '.result.fileName')
    echo "Downloaded video filename for quality $quality: $filename"

    # 4. List all videos
    echo "Listing all videos after download for quality $quality..."
    videos=$(curl -s "$BASE_URL/videos" | jq .)
    echo "$videos"

    # 5. Delete the downloaded video (uncomment to test deletion)
    # if [ -n "$filename" ]; then
    #     echo "Deleting the downloaded video for quality $quality..."
    #     delete_response=$(curl -s -X DELETE "$BASE_URL/videos/$filename")
    #     delete_status=$(echo $delete_response | jq -r '.status')
    #     if [ "$delete_status" == "success" ]; then
    #         echo "Video deleted successfully"
    #     else
    #         echo "Failed to delete video"
    #     fi
    # else
    #     echo "No filename found to delete"
    # fi

    # # 6. List videos again to confirm deletion (uncomment to test deletion)
    # echo "Listing videos after deletion for quality $quality..."
    # videos_after_deletion=$(curl -s "$BASE_URL/videos" | jq .)
    # echo "$videos_after_deletion"

    echo "API flow test for quality $quality completed."
done

echo "All quality tests completed."
