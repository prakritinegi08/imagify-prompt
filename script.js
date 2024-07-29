const token = "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ1c2VybmFtZSI6ImFlMWZmNDcyYjI4ZTgyN2Y5YjViYTJiMDU3ZTQ2ZDZkIiwiY3JlYXRlZF9hdCI6IjIwMjQtMDctMjhUMDg6NDM6NDguMjE4NTk0In0.ZFzNtqGKpQQwq8iYDHCChA_JBceOnRIAw3m_eOzA5rk";
const inputText = document.getElementById("input");
const image = document.getElementById("image");
const button = document.getElementById("btn");
const downloadBtn = document.getElementById("downloadBtn");

async function submitRequest(prompt) {
    const formData = new FormData();
    formData.append('prompt', prompt);
    formData.append('safe_filter', true);

    const options = {
        method: 'POST',
        headers: {
            accept: 'application/json',
            authorization: `Bearer ${token}`
        },
        body: formData
    };

    try {
        const response = await fetch('https://api.monsterapi.ai/v1/generate/txt2img', options);

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status} - ${response.statusText}`);
        }

        const result = await response.json();
        console.log('Submission Response JSON:', result);
        return result;
    } catch (error) {
        console.error('Error:', error);
        image.src = ""; // Clear the image on error
    }
}

async function fetchResult(statusUrl) {
    const options = {
        method: 'GET',
        headers: {
            accept: 'application/json',
            authorization: `Bearer ${token}`
        }
    };

    try {
        const response = await fetch(statusUrl, options);

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status} - ${response.statusText}`);
        }

        const result = await response.json();
        console.log('Fetch Result JSON:', result);
        return result;
    } catch (error) {
        console.error('Error:', error);
        image.src = ""; // Clear the image on error
    }
}

async function query() {
    image.src = "/loading.gif";  // Show a loading image while waiting
    downloadBtn.style.display = 'none'; // Hide download button while waiting

    const submitResult = await submitRequest(inputText.value);

    if (submitResult && submitResult.status_url) {
        // Keep checking the status until the image is ready
        let fetchResultData = null;
        while (true) {
            fetchResultData = await fetchResult(submitResult.status_url);
            if (fetchResultData.status === 'COMPLETED') {
                break;
            } else if (fetchResultData.status === 'FAILED') {
                throw new Error('Image generation failed');
            } else {
                console.log('Status:', fetchResultData.status);
                await new Promise(resolve => setTimeout(resolve, 5000)); // Wait 5 seconds before checking again
            }
        }

        return fetchResultData;
    } else {
        throw new Error('Error: status_url not found in submission response');
    }
}

button.addEventListener('click', async function() {
    try {
        const result = await query();
        if (result && result.result && result.result.output && result.result.output.length > 0) {
            const imageUrl = result.result.output[0];
            image.src = imageUrl;

            // Enable the download button with the image URL
            downloadBtn.href = imageUrl;
            downloadBtn.download = 'generated_image.png';
            downloadBtn.style.display = 'block'; // Show the download button
        } else {
            console.error('Error: Image URL not found in response');
            image.src = ""; // Clear the image if no URL found
            downloadBtn.style.display = 'none'; // Hide the download button
        }
    } catch (error) {
        console.error('Error:', error);
        image.src = ""; // Clear the image on error
        downloadBtn.style.display = 'none'; // Hide the download button
    }
});
