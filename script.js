// script.js

// When the page loads, check if window.name has been populated by the bookmarklet.
window.addEventListener("DOMContentLoaded", () => {
  if (window.name && window.name.trim() !== "") {
    const extractedHtml = window.name;
    document.getElementById("htmlInput").value = extractedHtml; // Optional: show HTML in textarea.
    extractVideoLinks(extractedHtml);
    window.name = ""; // Clear window.name so it doesn't reprocess on subsequent loads.
  }
  
  // Attach click event for manual extraction.
  document.getElementById("extractBtn").addEventListener("click", () => {
    const htmlInput = document.getElementById("htmlInput").value.trim();
    if (!htmlInput) {
      showMessage("Please paste the HTML from the logged in page.");
      return;
    }
    showMessage("Extracting video links...", false);
    extractVideoLinks(htmlInput);
  });
});

function showMessage(msg, isError = true) {
  const messageDiv = document.getElementById("message");
  messageDiv.textContent = msg;
  messageDiv.style.color = isError ? "red" : "green";
}

function extractVideoLinks(htmlSource) {
  const parser = new DOMParser();
  const doc = parser.parseFromString(htmlSource, "text/html");
  const elements = doc.querySelectorAll("[data-vid]");
  const videos = [];
  
  elements.forEach((el) => {
    const vid = el.getAttribute("data-vid");
    const subject = el.getAttribute("data-nname") || "No Subject";
    const order = parseInt(el.getAttribute("data-vit")) || 0;
    if (vid) {
      videos.push({ id: vid, subject: subject, order: order });
    }
  });
  
  if (videos.length === 0) {
    showMessage("No video links found in the provided HTML.");
    document.getElementById("resultsSection").style.display = "none";
    return;
  }
  
  videos.sort((a, b) => a.order - b.order);
  displayVideoLinks(videos);
}

function displayVideoLinks(videos) {
  const list = document.getElementById("videoLinksList");
  list.innerHTML = "";
  videos.forEach((video) => {
    const li = document.createElement("li");
    const titleSpan = document.createElement("span");
    titleSpan.textContent = `${video.order}. ${video.subject}: `;
    const link = document.createElement("a");
    link.href = `https://www.youtube.com/watch?v=${video.id}`;
    link.target = "_blank";
    link.textContent = `https://www.youtube.com/watch?v=${video.id}`;
    li.appendChild(titleSpan);
    li.appendChild(link);
    list.appendChild(li);
  });
  document.getElementById("resultsSection").style.display = "block";
  setupActionButtons(videos);
}

function setupActionButtons(videos) {
  document.getElementById("openAllBtn").onclick = () => {
    videos.forEach((video) => {
      window.open(`https://www.youtube.com/watch?v=${video.id}`, "_blank");
    });
  };

  document.getElementById("shareBtn").onclick = () => {
    let videoText = videos
      .map((video) => `${video.order}. ${video.subject}: https://www.youtube.com/watch?v=${video.id}`)
      .join("\n");
    // If a booklet has been added via the bookmarklet option, append it.
    if (window.bookletText) {
      videoText += "\n\n" + window.bookletText;
    }
    if (navigator.share) {
      navigator.share({
          title: "Video Links",
          text: videoText,
        })
        .catch((err) => console.error("Error sharing: ", err));
    } else {
      navigator.clipboard.writeText(videoText).then(() => {
        alert("Video links copied to clipboard!");
      });
    }
  };

  document.getElementById("copyBtn").onclick = () => {
    const videoUrls = videos
      .map((video) => `https://www.youtube.com/watch?v=${video.id}`)
      .join("\n");
    navigator.clipboard.writeText(videoUrls)
      .then(() => alert("Video URLs copied to clipboard!"))
      .catch((err) => console.error("Error copying URLs: ", err));
  };

  document.getElementById("exportBtn").onclick = () => {
    let videoText = videos
      .map((video) => `${video.order}. ${video.subject}: https://www.youtube.com/watch?v=${video.id}`)
      .join("\n");
    if (window.bookletText) {
      videoText += "\n\n" + window.bookletText;
    }
    let format = prompt("Enter export format (text/pdf):", "text");
    if (format) {
      format = format.toLowerCase();
      if (format === "pdf") {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
        const lines = doc.splitTextToSize(videoText, 180);
        doc.text(lines, 10, 10);
        doc.save("video_links.pdf");
      } else if (format === "text") {
        const blob = new Blob([videoText], { type: "text/plain" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "video_links.txt";
        a.click();
        URL.revokeObjectURL(url);
      } else {
        alert("Unsupported format. Please enter 'text' or 'pdf'.");
      }
    }
  };

  // "Add to Bookmark" button: show the bookmarklet code so the user can add it to their bookmarks.
  document.getElementById("addBookletBtn").onclick = () => {
    const bookmarkletCode = "javascript:(function(){ window.name = document.documentElement.outerHTML; window.location = 'https://thefoxbroo.github.io/video-links-extractor/'; })();";
    // Display the code in a prompt so the user can copy it.
    prompt("Right-click, copy the code below, and add it to your bookmarks bar:", bookmarkletCode);
  };
}
