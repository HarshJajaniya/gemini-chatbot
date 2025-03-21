document.addEventListener("DOMContentLoaded", () => {
const themeToggleBtn = document.getElementById("theme-toggle-btn");
const themeIcon = document.getElementById("theme-icon");
const body = document.body;
const promptForm = document.querySelector(".prompt-input"); 
const promptInput = document.querySelector(".prompt-input-form"); 
const chatsContainer = document.querySelector(".chats-container"); 
const fileInput = document.getElementById("file-input");
const fileUpload = document.querySelector(".file-upload-wrapper"); 
const filePreview = fileUpload.querySelector(".file-preview");
const label = document.getElementById("label");
let controller = null;


const API_KEY = "AIzaSyCxXmccv0KKx6I4w6-Yg9MYRj-FDEX55hs"; 
const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${API_KEY}`;

let userMsg = "";
const chatHistory = [];
let base64Image = "";
let imageMimeType = "image/png"; 


const createMsgElement = (content, ...classes) => {
    const div = document.createElement("div");
    div.classList.add("message", ...classes);
    div.innerHTML = content;
    return div;
};



const typeTextEffect = (element, text, speed = 50) => {
    let i = 0;
    element.textContent = "";
    window.stopTyping = false;

    function type() {
        if (window.stopTyping) {
            element.textContent = "Typing stopped..."; // Indicate stopped typing
            return;
        }

        if (i < text.length) {
            element.textContent += text.charAt(i);
            i++;
            setTimeout(type, speed);
        }
    }
    type();
};

const generateResponse = async (botMsgDiv) => {
    const textElement = botMsgDiv.querySelector(".message-text");

    let userParts = [{ text: "responsed in only plain text \n\n" +userMsg }];
    controller = new AbortController();
    console.log("Base64 before request:", base64Image);
    console.log("Image MIME Type:", imageMimeType);

    if (base64Image && imageMimeType) {
        console.log("Adding image data to request...");
        userParts.push({
            inlineData: {
                mimeType: imageMimeType,
                data: base64Image // Ensure only the base64 content (without data URL prefix)
            }
        });
    } else {
        console.log("No image found, sending only text.");
    }

    let requestBody = {
        contents: [
            {
                role: "user",
                parts: userParts
            }
        ]
    };

    console.log("Final Request Body:", JSON.stringify(requestBody, null, 2)); // Debugging

    try {
        const response = await fetch(API_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(requestBody),
            signal: controller.signal
        });

        const data = await response.json();
        console.log("API Response:", data); // Debugging

        if (!response.ok || !data.candidates || !data.candidates[0]?.content?.parts?.[0]?.text) {
            throw new Error("Invalid API response: " + JSON.stringify(data));
        }

        const responseText = data.candidates[0].content.parts[0].text.trim();
        botMsgDiv.classList.remove("loading");
        typeTextEffect(textElement, responseText, 50);

    } catch (error) {
        console.error("Error fetching response:", error);
        textElement.textContent = "⚠️ Error: Unable to get response.";
        botMsgDiv.classList.remove("loading");
    }
};



const handleFormSubmit = (e) => {
    e.preventDefault();
    userMsg = promptInput.value.trim();
    if (!userMsg && !base64Image) return;

    let userMsgHtml = `<p class="message-text">${userMsg}</p>`;

    if (base64Image) {
        userMsgHtml += `<img src="data:${imageMimeType};base64,${base64Image}" alt="Uploaded Image" class="user-image">`;
    }

    const userMsgDiv = createMsgElement(userMsgHtml, "user-message");
    chatsContainer.appendChild(userMsgDiv);

    promptInput.value = "";
     fileInput.value = "";
    filePreview.src = "";
    filePreview.style.backgroundImage = "none";
    fileUpload.classList.remove("active", "img-attached", "file-attached");


    setTimeout(() => {
        const botMsgHtml = `<img src="images/gemini-chatbot-logo.svg" alt="" class="avatar"><p class="message-text">Just a sec..</p>`;
        const botMsgDiv = createMsgElement(botMsgHtml, "bot-message", "loading");
        chatsContainer.appendChild(botMsgDiv);

        // Call generateResponse before resetting base64Image
        generateResponse(botMsgDiv).then(() => {
            base64Image = "";  // ✅ Reset AFTER request
            imageMimeType = "";
           
        });

    }, 600);


};

promptForm.addEventListener("submit", handleFormSubmit);

// File Upload Handling
label.innerHTML = `<span class="upload-icon material-symbols-rounded">add</span>`;
const cancelBtn = document.createElement("span");
cancelBtn.innerHTML = "✖";
cancelBtn.classList.add("cancel-btn");
cancelBtn.style.display = "none";
label.appendChild(cancelBtn);

fileInput.addEventListener("change", () => {
    console.log("File input changed");

    const file = fileInput.files[0];
    if (!file) {
        console.log("No file selected");
        return;
    }

    console.log("Selected file:", file.name, "Type:", file.type);

    const isImg = file.type.startsWith("image/");
    console.log("Is the selected file an image?", isImg);

    const reader = new FileReader();

    reader.onload = function (e) {
        console.log("FileReader loaded the file");

        if (isImg) {
            console.log("Displaying image preview");
            filePreview.src = e.target.result;
            filePreview.style.backgroundImage = `none`;

            // Extract only base64 content (remove "data:image/png;base64,")
            const base64String = e.target.result.split(",")[1];
            base64Image = base64String;
            imageMimeType = file.type;

            console.log("Base64 Image (truncated):", base64Image.substring(0, 50) + "..."); // Debugging
        } else {
            console.log("Displaying file icon instead of preview");
            filePreview.style.backgroundImage = `url('file-icon.png')`;
            filePreview.src = "";
            base64Image = "";
        }

        console.log("Updating UI classes");
        fileUpload.classList.remove("img-attached", "file-attached");
        fileUpload.classList.add("active", isImg ? "img-attached" : "file-attached");

        console.log("Hiding upload icon and displaying cancel button");
        label.querySelector(".upload-icon").style.display = "none";
        cancelBtn.style.display = "inline-block";
    };

    console.log("Reading file as Data URL");
    reader.readAsDataURL(file);
});


cancelBtn.addEventListener("click", (event) => {
    event.stopPropagation();
    fileInput.value = "";
    filePreview.src = "";
    filePreview.style.backgroundImage = "none";
    fileUpload.classList.remove("active", "img-attached", "file-attached");
    base64Image = ""; 
    imageMimeType = ""; 
    label.querySelector(".upload-icon").style.display = "inline-block";
    cancelBtn.style.display = "none";
});

label.addEventListener("click", (event) => {
    if (event.target !== cancelBtn) {
        fileInput.click();
    }
});




    if (!themeToggleBtn || !themeIcon) {
        console.error("Theme toggle button or icon not found in the DOM.");
        return; // Stop execution if elements are missing
    }

    // Load the theme from localStorage
    if (localStorage.getItem("theme") === "light") {
        body.classList.add("light-theme");
        themeIcon.textContent = "dark_mode"; // Set moon icon for light mode
    } else {
        themeIcon.textContent = "light_mode"; // Set sun icon for dark mode
    }

    // Toggle theme on button click
    themeToggleBtn.addEventListener("click", () => {
        body.classList.toggle("light-theme");

        if (body.classList.contains("light-theme")) {
            localStorage.setItem("theme", "light");
            themeIcon.textContent = "dark_mode"; // Change to moon icon
        } else {
            localStorage.setItem("theme", "dark");
            themeIcon.textContent = "light_mode"; // Change to sun icon
        }
    });
    
    document.getElementById("stop-btn").addEventListener("click", () => {
        if (controller) {
            controller.abort(); // Stop the fetch request
            console.log("Fetch aborted!");
        }
        
        window.stopTyping = true; // Stop the typing effect

        // Find the latest bot message and clear it
        const lastBotMessage = document.querySelector(".bot-message .message-text");
        if (lastBotMessage) {
            lastBotMessage.textContent = "";
        }
    });

    document.getElementById("delete-chats-btn").addEventListener("click", () => {
        chatsContainer.innerHTML = ""; // Remove all messages
        base64Image = ""; // Reset image data
        imageMimeType = ""; // Reset MIME type
        promptInput.value = ""; // Clear input field
        fileInput.value = ""; // Reset file input
        filePreview.src = ""; // Clear file preview
        filePreview.style.backgroundImage = "none"; // Reset background image
        fileUpload.classList.remove("active", "img-attached", "file-attached");
        console.log("Chat cleared!");
    });
});

