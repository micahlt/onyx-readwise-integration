const handle = (e) => {
  e.target.innerText = "loading file...";
  document.getElementById("fileInput").click();
};

const upload = (e) => {
  const reader = new FileReader();
  reader.addEventListener("load", () => {
    chrome.runtime.sendMessage({ type: "export", content: reader.result });
  });
  reader.readAsText(e.target.files[0]);
};

document.getElementById("export").addEventListener("click", handle);
document.getElementById("fileInput").addEventListener("change", upload);
