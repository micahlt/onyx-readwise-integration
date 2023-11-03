let access_token = "";
chrome.runtime.onMessage.addListener(async (message, sender, sendResponse) => {
  if (message.type == "export") {
    sendResponse("ok");
    // initialize highlights to an array of arrays
    let highlights = [[]];
    let final = [];
    const lines = message.content.trim().split("\n");
    const book = lines[0].split("<<")[1].split(">>");
    const title = book[0];
    const author = book[1];
    lines.splice(0, 1);
    let highlight = 0;
    // group lines into individual highlights
    lines.forEach((line) => {
      if (line != "-------------------") {
        highlights[highlight].push(line);
      } else {
        highlights.push([]);
        highlight++;
      }
    });
    highlights.forEach((hl) => {
      if (hl.length < 1) return;
      let date, page, hasSection;
      // get highlight metadata
      let meta = hl[0].split("|");
      // handle section titles
      if (meta.length < 2) {
        meta = hl[1].split("|");
        hasSection = true;
      }
      // parse date and page number
      date = new Date(meta[0].trim()).toISOString();
      page = meta[1].split(": ")[1];
      const addToList = (line) => {
        if (line.includes("【Note】")) {
          final[final.length - 1].note = line.split("【Note】")[1];
        } else {
          final.push({
            text: line,
            title: title,
            author: author,
            category: "books",
            location: Number(page),
            location_type: "page",
            highlighted_at: date,
          });
        }
      };
      let lines = "";
      let addAfter = true;
      hl.forEach((line, lineNo) => {
        const pageLimit = hasSection ? 2 : 1;
        // handle multiple highlights per page with section title
        if (lineNo >= pageLimit) {
          if (!line.includes("【Note】")) {
            lines = lines + "\n" + line;
          } else {
            addAfter = false;
            addToList(lines);
            addToList(line);
          }
        }
      });
      if (addAfter) addToList(lines);
    });
    chrome.cookies.getAll(
      {
        domain: "readwise.io",
      },
      async (cookies) => {
        const access_token = cookies.filter((c) => c.name == "accessToken")[0]
          ?.value;
        if (!access_token) {
          return;
        }
        fetch(`https://readwise.io/api/v2/highlights/`, {
          method: "POST",
          headers: {
            Authorization: `Token ${access_token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ highlights: final }),
        }).then((res) => {
          if (res.ok) {
            chrome.tabs.create({
              url: "https://readwise.io/dashboard",
            });
          }
        });
      }
    );
  } else {
    sendResponse("err");
  }
});
