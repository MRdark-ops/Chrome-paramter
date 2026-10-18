function create_custom_regex_element(){
    let el = document.createElement("div")
    el.classList.add("custom-regex")
    el.appendChild(document.createTextNode("/"))
    let regex_el = document.createElement("span")
    regex_el.setAttribute("contenteditable", "true")
    regex_el.classList.add("regex")
    regex_el.textContent = "YOUR_REGEX"
    regex_el.addEventListener("click", (e) => {
        if(e.target.textContent == "YOUR_REGEX"){
            const range = document.createRange();
            range.selectNodeContents(e.target);

            const selection = window.getSelection();
            selection.removeAllRanges();
            selection.addRange(range);
        }
    })
    regex_el.addEventListener("focusout", (e) => {
        if(e.target.textContent == ""){
            e.target.textContent = "YOUR_REGEX"
            const range = document.createRange();
            range.selectNodeContents(e.target);

            const selection = window.getSelection();
            selection.removeAllRanges();
            selection.addRange(range);
            e.target.focus()
        }
    })
    el.appendChild(regex_el)
    el.appendChild(document.createTextNode("/g"))
    let remove_el = document.createElement("span")
    remove_el.textContent = "-"
    remove_el.classList.add("regex-remove-btn")
    remove_el.addEventListener("click", (e) => {
        if(document.querySelectorAll(".custom-regex").length > 1){
            e.target.parentElement.remove()
        }
    })
    el.appendChild(remove_el)
    return el
}

function add_new_custom_regex_btn(){
    let el = document.createElement("div")
    el.textContent = "+"
    el.classList.add("add-new-regex-btn")
    el.addEventListener("click", () => {
        document.querySelector(".custom-regexes").appendChild(create_custom_regex_element())
    })
    return el
}


document.querySelector(".js_crawler_settings").addEventListener("click", () => {
    var modal = document.querySelector(".jsModal");
    modal.style.display = "block";

    chrome.storage.local.get("js_links", (result) => {
      const arr = result["js_links"] || [];
      if(!arr){
        return
      }
      let links = arr[matchAnyPattern(Object.keys(arr), getQueryParam("url"), true)][getQueryParam("url")]['links']
      links.forEach(link => {
        let js_div = document.createElement("div")
        js_div.innerHTML = `
        <div class="js_link">
            <span class="link">
                <span class="link-data">${shortenToXChars(link.split("?")[0], 60)}</span>
                <span class="link-open-btn" aria-link="${link}">open</span>
            </span>
        <span class="chkbox">
            <input type="checkbox" checked name="link_chbox" aria-link="${link}">
        </span>
        </div>
        `
        js_div.querySelector("input[name='link_chbox']").addEventListener("change", () => {
            func1()
        })
        js_div.querySelector(".link-data").addEventListener("click", () => {
            js_div.querySelector("input[name='link_chbox']").checked = !js_div.querySelector("input[name='link_chbox']").checked
            func1()
        })
        js_div.querySelector(".link-open-btn").addEventListener("click", (el) => {
            window.open(link, "_blank")
        })

        document.querySelector(".js_link_container").appendChild(js_div)
      });
        document.querySelector(".links_number").textContent = `${links.length} javascript links`
        func1()
    })
    
    document.querySelector(".regex-filter").appendChild(add_new_custom_regex_btn())
    document.querySelector(".custom-regexes").appendChild(create_custom_regex_element())

    window.onclick = function(event) {
        if (event.target == modal) {
            modal.style.display = "none";
            document.getElementById("js_crawler_output").textContent = ""
        }
    }
    var span = document.querySelector(".jsModal-close");
        span.addEventListener("click", () => {
        modal.style.display = "none";
        document.getElementById("js_crawler_output").textContent = ""
    })
})


// document.querySelector(".js_crawler_settings").click()


function func1(){
    if(Object.values(document.querySelectorAll('input[name="link_chbox"]')).filter(e => e.checked == 1).length == document.querySelector(".links_number").textContent.split(" ")[0]){
        document.querySelector(".select_all_links_btn").textContent = "Select None"
    }else {
        document.querySelector(".select_all_links_btn").textContent = "Select All"
    }
    document.querySelector(".selected_number").textContent = `${Object.values(document.querySelectorAll('input[name="link_chbox"]')).filter(e => e.checked == 1).length} links selected`
}


document.querySelectorAll(".js_link").forEach(el => {
    el.addEventListener("click", () => {
        el.querySelector("input[name='link_chbox']").click()
    })
    
})

document.querySelector(".select_all_links_btn").addEventListener("click", (el) => {
    let chboxes = document.querySelector(".jsModal").querySelectorAll("input[name='link_chbox']")
    if(el.target.textContent == "Select All"){
        chboxes.forEach(box => {
            box.checked = 1
        })
        document.querySelector(".selected_number").textContent = `${Object.values(document.querySelectorAll('input[name="link_chbox"]')).filter(e => e.checked == 1).length} links selected`
        el.target.textContent = "Select None"
    }else {
        chboxes.forEach(box => {
            box.checked = 0
        })
        document.querySelector(".selected_number").textContent = `${Object.values(document.querySelectorAll('input[name="link_chbox"]')).filter(e => e.checked == 1).length} links selected`
        el.target.textContent = "Select All"
    }
})

document.querySelector(".crawl_btn").addEventListener("click", (el) => {
    let links = Object.values(document.querySelectorAll('input[name="link_chbox"]')).filter(e => e.checked == 1).map(e => e.getAttribute("aria-link"))
    let options = Object.values(document.querySelectorAll('.options_chbox')).filter(e => e.checked == 1).map(e => e.id)
    let params = []
    let completed = 0
    let total = links.length
    let progressContainer = document.querySelector(".crawl_progress_container")
    let progressBar = document.querySelector(".crawl_progress_bar")
    let wordsCountEl = document.querySelector(".crawl_words_count")
    progressContainer.style.display = "block"
    progressBar.style.width = "0%"
    wordsCountEl.textContent = "0 words found"
    el.target.textContent = `⟳`
    links.forEach(link => {
        extract_from_js_link(link, options).then(
            result => {
                params = [...new Set(params.concat(result))]
                document.getElementById("js_crawler_output").setAttribute("row", params.length)
                document.getElementById("js_crawler_output").textContent = params.join("\n")
                wordsCountEl.textContent = `${params.length} words found`
                completed++
                progressBar.style.width = `${Math.round((completed / total) * 100)}%`
                if (completed === total) {
                    el.target.textContent = "Crawl"
                    setTimeout(() => {
                        progressContainer.style.display = "none"
                    }, 1000)
                }
            }
        )
    })
})

document.getElementById("add_crawled_to_target_btn").addEventListener("click", (el) => {
    let output = document.getElementById("js_crawler_output").textContent.trim()
    if (!output) return
    let words = output.split("\n").map(w => w.trim()).filter(w => w !== "")
    if (words.length === 0) return
    chrome.storage.local.get("urls", (result) => {
        const arr = result["urls"] || [];
        let url = matchAnyPattern(arr, getQueryParam("url"), true)
        saveKeywordsToURLFactors(words, url, url)
        location.reload()
    })
})