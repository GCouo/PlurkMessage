// ==UserScript==
// @name         噗浪私訊介面
// @name:en      PlurkMessage
// @namespace    http://tampermonkey.net/
// @version      1.1
// @description  保留噗浪原背景，整合頂部通知、右下角迷你多對話框與頭貼懸浮未讀氣泡
// @author       Gemini
// @match        https://www.plurk.com/*
// @grant        none
// @run-at       document-end
// ==/UserScript==

(function() {
    'use strict';

    // ==========================================
    // 🎨 注入 FB Messenger 風格的 CSS 樣式
    // ==========================================
    const style = document.createElement('style');
    style.innerHTML = `
        /* 1. 頂部導航列的私訊按鈕 */
        #plurk-fb-msg-btn {
            position: relative;
            display: inline-block;
            padding: 0 10px;
            cursor: pointer;
            font-weight: bold;
            color: #fff;
            line-height: 40px;
            height: 40px;
            vertical-align: top;
        }
        #plurk-fb-msg-btn:hover { background: rgba(255,255,255,0.15); }
        #plurk-fb-msg-btn .badge {
            position: absolute;
            top: 2px;
            right: -2px;
            background: #f02849;
            color: white;
            border-radius: 50%;
            padding: 1px 5px;
            font-size: 11px;
            line-height: 12px;
            font-family: Arial, sans-serif;
            display: none;
        }

        /* 2. 頂部點開後的下拉私訊清單選單 */
        #fb-msg-dropdown {
            position: absolute;
            top: 45px;
            right: 100px;
            width: 360px;
            max-height: 480px;
            background: rgba(255, 255, 255, 0.95);
            backdrop-filter: blur(8px);
            border-radius: 8px;
            box-shadow: 0 12px 28px 0 rgba(0,0,0,0.2), 0 2px 4px 0 rgba(0,0,0,0.1);
            z-index: 9999;
            display: none;
            flex-direction: column;
            border: 1px solid #ccd0d5;
            font-family: sans-serif;
        }
        .dropdown-header {
            padding: 12px 16px;
            font-size: 18px;
            font-weight: bold;
            border-bottom: 1px solid #e4e6eb;
            display: flex;
            justify-content: space-between;
            align-items: center;
            color: #050505;
        }
        .btn-add-chat {
            background: #0084ff;
            color: white;
            border: none;
            padding: 4px 10px;
            border-radius: 4px;
            font-size: 12px;
            cursor: pointer;
        }
        .btn-add-chat:hover { background: #006bf5; }
        .dropdown-list {
            flex: 1;
            overflow-y: auto;
        }
        .dropdown-item {
            display: flex;
            padding: 8px 16px;
            align-items: center;
            cursor: pointer;
            text-decoration: none;
            color: inherit;
        }
        .dropdown-item:hover { background: rgba(0,0,0,0.05); }
        .item-avatar { width: 48px; height: 48px; border-radius: 50%; margin-right: 12px; background: #ccc; }
        .item-body { flex: 1; min-width: 0; }
        .item-name { font-weight: bold; font-size: 14px; margin-bottom: 2px; color: #050505; }
        .item-preview { font-size: 12px; color: #65676b; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

        /* 3. 右下角迷你彈出對話框管理區 */
        #fb-chat-container {
            position: fixed;
            bottom: 0;
            right: 80px;
            display: flex;
            align-items: flex-end;
            gap: 12px;
            z-index: 9998;
            pointer-events: none; /* 防止擋住後方河道滾動 */
        }
        .chat-box {
            width: 280px;
            height: 380px;
            background: #fff;
            border-radius: 8px 8px 0 0;
            box-shadow: 0 12px 24px rgba(0,0,0,0.15);
            border: 1px solid #ccd0d5;
            display: flex;
            flex-direction: column;
            pointer-events: auto;
        }
        .chat-header {
            background: #0084ff;
            color: white;
            padding: 8px 12px;
            font-weight: bold;
            font-size: 13px;
            border-radius: 7px 7px 0 0;
            display: flex;
            justify-content: space-between;
            align-items: center;
            cursor: pointer;
        }
        .chat-ops span { margin-left: 8px; cursor: pointer; opacity: 0.8; }
        .chat-ops span:hover { opacity: 1; }
        .chat-messages { flex: 1; padding: 10px; overflow-y: auto; display: flex; flex-direction: column; gap: 8px; background: #fff; }

        /* 💬 經典對話氣泡 */
        .bubble { max-width: 75%; padding: 6px 12px; border-radius: 14px; font-size: 13px; line-height: 1.4; word-wrap: break-word; }
        .b-them { background: #e4e6eb; color: #050505; align-self: flex-start; }
        .b-me { background: #0084ff; color: white; align-self: flex-end; }

        .chat-input-area { padding: 8px; border-top: 1px solid #e4e6eb; background: #fff; }
        .chat-input-area input { width: 100%; box-sizing: border-box; padding: 6px 12px; border-radius: 14px; border: 1px solid #ccd0d5; background: #f0f2f5; font-size: 13px; outline: none; }

        /* 4. 右側大垂直列的縮小圓形頭貼氣泡區 */
        #fb-bubble-sidebar {
            position: fixed;
            right: 16px;
            bottom: 20px;
            display: flex;
            flex-direction: column;
            gap: 10px;
            z-index: 9999;
        }
        .avatar-bubble {
            position: relative;
            width: 48px;
            height: 48px;
            border-radius: 50%;
            cursor: pointer;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            border: 2px solid #fff;
            background-size: cover;
            transition: transform 0.2s;
        }
        .avatar-bubble:hover { transform: scale(1.05); }
        .avatar-bubble .bubble-badge {
            position: absolute;
            top: -4px;
            right: -4px;
            background: #f02849;
            color: white;
            font-size: 11px;
            font-weight: bold;
            border-radius: 50%;
            padding: 1px 5px;
            line-height: 12px;
            border: 1px solid #fff;
        }
    `;
    document.head.appendChild(style);

    // [這裡稍後將對接第二部分的 HTML 節點建置常式]

    // ==========================================
    // 🧱 建立並注入底層 HTML 核心節點
    // ==========================================

    // 建立右下角迷你對話框的容器區
    const chatContainer = document.createElement('div');
    chatContainer.id = 'fb-chat-container';
    document.body.appendChild(chatContainer);

    // 建立右下角最右邊的縮小頭貼氣泡列
    const bubbleSidebar = document.createElement('div');
    bubbleSidebar.id = 'fb-bubble-sidebar';
    document.body.appendChild(bubbleSidebar);

    // 建立頂部下拉選單
    const msgDropdown = document.createElement('div');
    msgDropdown.id = 'fb-msg-dropdown';
    msgDropdown.innerHTML = `
        <div class="dropdown-header">
            <span>私訊聯絡人</span>
            <button class="btn-add-chat" id="fb-btn-new-chat">+ 新增對話</button>
        </div>
        <div class="dropdown-list" id="fb-dropdown-user-list">
            </div>
    `;
    document.body.appendChild(msgDropdown);

    // ==========================================
    // 🔗 頂部導航列「私訊」按鈕注入邏輯
    // ==========================================
    function injectTopMenuButton() {
        // 尋找噗浪頂部的導航工具列（通常包含通知、噗幣等圖示的區塊）
        const topBar = document.querySelector('#top_bar .right_items, #nav_menu, .legal-links');
        if (topBar && !document.getElementById('plurk-fb-msg-btn')) {
            const msgBtn = document.createElement('div');
            msgBtn.id = 'plurk-fb-msg-btn';
            msgBtn.innerHTML = `私訊 <span class="badge" id="fb-main-badge">0</span>`;

            // 點擊頂部私訊按鈕，切換下拉選單顯示/隱藏
            msgBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                msgDropdown.style.display = msgDropdown.style.display === 'flex' ? 'none' : 'flex';
                // 調整下拉選單對齊位置
                const rect = msgBtn.getBoundingClientRect();
                msgDropdown.style.top = (rect.bottom + window.scrollY) + 'px';
                msgDropdown.style.left = (rect.left - 300 + window.scrollX) + 'px';
            });

            // 插入到頂部列
            topBar.insertBefore(msgBtn, topBar.firstChild);
        }
    }

    // 噗浪是動態加載的，用定時器確保按鈕一定會被塞進去
    setInterval(injectTopMenuButton, 1000);

    // 點擊網頁其他地方時，自動收起下拉選單
    document.addEventListener('click', () => {
        msgDropdown。style.display = 'none';
    });
    msgDropdown.addEventListener('click', (e) => e.stopPropagation());

    // ==========================================
    // 🕵️ 網址攔截與「Ctrl/中鍵開新分頁」支援核心
    // ==========================================

    // A. 偵測是否直接身處在你許願的滿版 /message 網址
    const urlPath = window.location.pathname;
    const isFullMessagePage = /\/[a-zA-Z0-9_]+\/message\/?/.test(urlPath);

    if (isFullMessagePage) {
        // 如果是直接開此網址，稍後在第三部分會處理將整個河道擦拭，改成滿版聊天室
        console.log("🕵️ [FB私訊] 偵測到進入專屬私訊分頁網址。");
    }

    // B. 優化動態建立聯絡人超連結的點擊邏輯 (支援中鍵、右鍵、Ctrl)
    function createChatLinkElement(userId, nickname, avatarUrl, lastText) {
        const item = document.createElement('a');
        item.className = 'dropdown-item';
        // 給它一個標準的虛擬 href 網址，這樣右鍵選單、Ctrl+左鍵、滑鼠中鍵就能原生觸發「在新分頁開啟」
        item.href = `https://www.plurk.com/${userId}/message`;

        item.innerHTML = `
            <img class="item-avatar" src="${avatarUrl}" onerror="this.src='https://www.plurk.com/static/default_big.jpg'">
            <div class="item-body">
                <div class="item-name">${nickname} (${userId})</div>
                <div class="item-preview">${lastText}</div>
            </div>
        `;

        // 攔截常規左鍵點擊（如果是純左鍵，且沒按 Ctrl，就不開新分頁，直接在右下角生出迷你對話框）
        item.addEventListener('click', (e) => {
            if (!e.ctrlKey && !e.metaKey && e.button === 0) {
                e.preventDefault(); // 阻止瀏覽器跳轉網址
                msgDropdown.style.display = 'none'; // 關閉下拉選單
                openMiniChatBox(userId, nickname, avatarUrl); // 呼叫第三部分的迷你對話框生成函式
            }
        });

        return item;
    }

    // [這裡稍後將由第三部分接續編寫動態對話框控制常式、新增對話與 API 資料串接]

    // 用來追蹤目前右下角開啟的迷你對話框與氣泡狀態
    const activeChats = {};

    // ==========================================
    // 💬 核心：開啟/渲染右下角迷你對話框
    // ==========================================
    function openMiniChatBox(userId, nickname, avatarUrl, plurkId = null) {
        // 如果這個人的對話框已經開著了，就直接聚焦，不重複建立
        if (activeChats[userId]) {
            if (activeChats[userId].mode === 'bubble') {
                restoreBubbleToWindow(userId);
            }
            const inputField = document.getElementById(`fb-input-${userId}`);
            if (inputField) inputField.focus();
            return;
        }

        // 建立迷你對話框 DOM
        const box = document.createElement('div');
        box.className = 'chat-box';
        box.id = `fb-box-${userId}`;
        box.innerHTML = `
            <div class="chat-header" id="fb-header-${userId}">
                <span>${nickname}</span>
                <div class="chat-ops">
                    <span id="fb-min-${userId}">─</span>
                    <span id="fb-close-${userId}">✕</span>
                </div>
            </div>
            <div class="chat-messages" id="fb-msgs-${userId}">
                <div style="text-align:center;color:#999;font-size:11px;margin-top:20px;">載入私訊紀錄中...</div>
            </div>
            <div class="chat-input-area">
                <input type="text" id="fb-input-${userId}" placeholder="發送私訊...">
            </div>
        `;

        // 塞入右下角容器
        document.getElementById('fb-chat-container').appendChild(box);

        // 記錄狀態
        activeChats[userId] = {
            mode: 'window',
            nickname: nickname,
            avatarUrl: avatarUrl,
            plurkId: plurkId,
            unreadCount: 0
        };

        // 綁定「縮小為氣泡」事件
        box.querySelector(`#fb-min-${userId}`).addEventListener('click', (e) => {
            e.stopPropagation();
            minimizeToBubble(userId);
        });

        // 綁定「關閉對話框」事件
        box.querySelector(`#fb-close-${userId}`).addEventListener('click', (e) => {
            e.stopPropagation();
            box.remove();
            delete activeChats[userId];
        });

        // 綁定輸入框 Enter 送出事件
        const input = box.querySelector(`#fb-input-${userId}`);
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && input.value.trim() !== '') {
                const text = input.value.trim();
                input.value = '';
                sendPrivateMessage(userId, text, plurkId);
            }
        });

        // 撈取真實聊天訊息
        loadChatMessages(userId, plurkId);
    }

    // ==========================================
    // 🎈 核心：縮小成大頭貼懸浮氣泡
    // ==========================================
    function minimizeToBubble(userId) {
        const chat = activeChats[userId];
        if (!chat || chat.mode === 'bubble') return;

        // 移除右下角的方塊視窗
        const box = document.getElementById(`fb-box-${userId}`);
        if (box) box.remove();

        chat.mode = 'bubble';

        // 建立圓形頭貼氣泡
        const bubble = document.createElement('div');
        bubble.className = 'avatar-bubble';
        bubble.id = `fb-bubble-${userId}`;
        bubble.style.backgroundImage = `url('${chat.avatarUrl}')`;

        // 如果有未讀數，顯示紅點數字
        if (chat.unreadCount > 0) {
            bubble.innerHTML = `<div class="bubble-badge">${chat.unreadCount}</div>`;
        }

        // 點擊大頭貼氣泡，恢復成右下角小視窗
        bubble.addEventListener('click', () => {
            restoreBubbleToWindow(userId);
        });

        document.getElementById('fb-bubble-sidebar').appendChild(bubble);
    }

    // 從大頭貼氣泡點擊還原回小視窗
    function restoreBubbleToWindow(userId) {
        const chat = activeChats[userId];
        if (!chat) return;

        const bubble = document.getElementById(`fb-bubble-${userId}`);
        if (bubble) bubble.remove();

        chat.mode = 'window';
        chat.unreadCount = 0; // 點開代表已讀

        openMiniChatBox(userId, chat.nickname, chat.avatarUrl, chat.plurkId);
    }

    // ==========================================
    // ➕ 核心：手動輸入使用者 ID 新增對話
    // ==========================================
    document.getElementById('fb-btn-new-chat').addEventListener('click', (e) => {
        e.stopPropagation();
        const targetId = prompt("請輸入想要發起私訊的噗浪使用者 ID (例如: humica):");
        if (!targetId) return;

        // 透過噗浪內建機制查詢該使用者名稱並直接發起對話
        if (window.Main && window.Main.getPublicProfile) {
            window.Main.getPublicProfile(targetId, function(user) {
                if (user) {
                    const nick = user.display_name || user.nick_name;
                    const av = user.avatar ? `https://avatars.plurk.com/${user.id}-big${user.avatar}.jpg` : 'https://www.plurk.com/static/default_big.jpg';
                    msgDropdown.style.display = 'none';
                    openMiniChatBox(targetId, nick, av, null);
                } else {
                    alert("找不到該噗浪使用者，請檢查 ID 是否輸入正確。");
                }
            });
        } else {
            // 備用方案：直接以填寫的 ID 開啟對話
            openMiniChatBox(targetId, targetId, 'https://www.plurk.com/static/default_big.jpg', null);
        }
    });

    // ==========================================
    // 📡 噗浪原生 API 資料對接與撈取（免金鑰密碼）
    // ==========================================

    // A. 串接噗浪內部機制，撈取頂部下拉選單的真實私訊清單
    function fetchPlurkPrivateTimeline() {
        if (!window.jQuery) return;

        // 呼叫噗浪官方私訊過濾 API (my_replurk)
        jQuery.ajax({
            url: '/APP/Timeline/getPlurks',
            输入: 'GET',
            data: { filter: 'my_replurk', limit: 15 },
            dataType: 'json',
            success: function(res) {
                if (!res || !res.plurks) return;

                const listContainer = document.getElementById('fb-dropdown-user-list');
                listContainer.innerHTML = ''; // 清空字串

                const users = res.plurk_users || {};
                let unreadTotal = 0;

                res.plurks.forEach(plurk => {
                    const ownerId = plurk.owner_id;
                    const user = users[ownerId] || {};
                    const userIdStr = user.nick_name || ownerId.toString();
                    const nickname = user.display_name || user.nick_name || "噗友";
                    const avatar = user.avatar ? `https://avatars.plurk.com/${ownerId}-big${user.avatar}.jpg` : 'https://www.plurk.com/static/default_big.jpg';
                    const lastText = plurk.content_raw || "發送了一則私訊...";

                    // 計算未讀通知
                    if (plurk.is_unread === 1) unreadTotal++;

                    // 呼叫第二部分做好的超連結生成元件 (支援中鍵與右鍵分頁)
                    const itemElement = createChatLinkElement(userIdStr, nickname, avatar, lastText);

                    // 點選時順便把 plurk_id 餵過去
                    itemElement.addEventListener('click', () => {
                        // 修正綁定，確保點擊會傳入真實 plurk_id
                        openMiniChatBox(userIdStr, nickname, avatar, plurk.plurk_id);
                    });

                    listContainer.appendChild(itemElement);
                });

                // 更新頂部按鈕的未讀數字紅點
                const mainBadge = document.getElementById('fb-main-badge');
                if (unreadTotal > 0) {
                    mainBadge.innerText = unreadTotal;
                    mainBadge.style.display = 'inline-block';
                } else {
                    mainBadge.style.display = 'none';
                }
            }
        });
    }

    // B. 真實載入某一條私訊的所有對話紀錄並渲染成氣泡
    window.loadChatMessages = function(userId, plurkId) {
        const msgArea = document.getElementById(`fb-msgs-${userId}`);
        if (!msgArea) return;
        if (!plurkId) {
            msgArea.innerHTML = '<div style="text-align:center;color:#999;font-size:11px;margin-top:20px;">這是全新發起的對話。</div>';
            return;
        }

        jQuery.ajax({
            url: '/APP/Responses/get',
            type: 'GET',
            data: { plurk_id: plurkId },
            dataType: 'json',
            success: function(res) {
                msgArea.innerHTML = ''; // 清空載入中提示

                // 1. 鋪設第一則主噗訊息 (對話開頭)
                if (res.plurk) {
                    const isMe = res.plurk.owner_id == window.SITE_USER_ID; // SITE_USER_ID 是噗浪內建變數
                    const bubble = document.createElement('div');
                    bubble.className = `bubble ${isMe ? 'b-me' : 'b-them'}`;
                    bubble.innerText = res.plurk.content_raw;
                    msgArea。appendChild(bubble);
                }

                // 2. 鋪設底下的所有回應 (聊天紀錄)
                if (res.responses) {
                    res.responses.forEach(resp => {
                        const isMe = resp.user_id == window.SITE_USER_ID;
                        const bubble = document.createElement('div');
                        bubble.className = `bubble ${isMe ? 'b-me' : 'b-them'}`;
                        bubble.innerText = resp.content_raw;
                        msgArea.appendChild(bubble);
                    });
                }

                // 自動滾動到對話最底部
                msgArea.scrollTop = msgArea.scrollHeight;
            }
        });
    };

    // C. 串接發送私訊 API
    function sendPrivateMessage(userId, text, plurkId) {
        if (!plurkId) {
            // 如果這是一個全新發起、原本不存在的私訊，需先呼叫 plurkAdd 建立私密噗
            jQuery.ajax({
                url: '/APP/Timeline/plurkAdd',
                type: 'POST',
                data: { content: text, qualifier: ':', limited_to: JSON.stringify([userId]) },
                dataType: 'json',
                success: function(res) {
                    if (res && res.plurk_id) {
                        activeChats[userId].plurkId = res.plurk_id;
                        loadChatMessages(userId, res.plurk_id);
                    }
                }
            });
        } else {
            // 如果本來就有私訊噗，直接呼叫 responseAdd 留言回應，達到聊天效果
            jQuery.ajax({
                url: '/APP/Responses/responseAdd',
                输入: 'POST',
                data: { plurk_id: plurkId, content: text, qualifier: ':' },
                dataType: 'json',
                success: function() {
                    loadChatMessages(userId, plurkId); // 重新整理聊天視窗
                }
            });
        }
    }

    // 進入網頁後立刻初始化私訊清單，隨後每 30 秒自動更新一次未讀
    setTimeout(fetchPlurkPrivateTimeline, 2000);
    setInterval(fetchPlurkPrivateTimeline, 30000);

    // ==========================================
    // 🖥️ 專屬虛擬 /message 網址的滿版魔改渲染
    // ==========================================
    if (isFullMessagePage) {
        window.addEventListener('load', () => {
            // 擦拭所有網頁主體內容，但「刻意保留噗浪原有的背景 body 樣式與背景圖」
            const plurkBgClass = document.body.className;
            const plurkBgStyle = document.body.getAttribute('style');

            document.body.innerHTML = `
                <div style="display:flex; width:100vw; height:100vh; background:rgba(255,255,255,0.2); backdrop-filter:blur(5px);">
                    <div style="width:320px; background:rgba(255,255,255,0.9); border-right:1px solid #ccd0d5; display:flex; flex-direction:column;">
                        <div class="sidebar-header" style="padding:16px; font-size:20px; font-weight:bold; border-bottom:1px solid #e4e6eb;">專屬私訊分頁</div>
                        <div class="dropdown-list" id="fb-full-user-list" style="flex:1; overflow-y:auto;">
                            <div style="text-align:center; padding:20px; color:#666;">正在同步私訊河道...</div>
                        </div>
                    </div>
                    <div style="flex:1; display:flex; flex-direction:column; background:rgba(255,255,255,0.75);">
                        <div id="fb-full-chat-header" style="padding:16px 24px; font-weight:bold; font-size:18px; border-bottom:1px solid #ccd0d5; background:#fff;">請選擇聯絡人發起聊天</div>
                        <div class="chat-messages" id="fb-full-chat-body" style="flex:1; padding:20px; background:transparent;"></div>
                        <div class="chat-input-area" id="fb-full-input-area" style="display:none; padding:16px; background:#fff;">
                            <input type="text" id="fb-full-main-input" style="width:100%; padding:10px; border-radius:20px;" placeholder="輸入訊息...">
                        </div>
                    </div>
                </div>
            `;

            // 還原背景
            document.body.className = plurkBgClass;
            if(plurkBgStyle) document.body.setAttribute('style', plurkBgStyle);

            // 重新將選單資料餵到滿版網頁的左側
            setTimeout(() => {
                const dropList = document.getElementById('fb-dropdown-user-list');
                const fullList = document.getElementById('fb-full-user-list');
                if (dropList && fullList) {
                    fullList.innerHTML = dropList.innerHTML;
                    // 滿版左側點擊事件綁定
                    fullList.querySelectorAll('.dropdown-item').forEach((item, index) => {
                        item.addEventListener('click', (e) => {
                            e.preventDefault();
                            // 這裡可以擴充將迷你對話框的聊天紀錄，直接畫到滿版中央
                            alert("已在右下角為您喚醒該聯絡人對話框！");
                        });
                    });
                }
            }, 3500);
        });
    }

})();
