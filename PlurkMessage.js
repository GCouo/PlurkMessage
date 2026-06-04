// ==UserScript==
// @name         噗浪智慧 FB 風格私訊擴充套件 (修正版)
// @namespace    http://tampermonkey.net/
// @version      1.2
// @description  保留噗浪原背景，整合頂部通知、右下角迷你多對話框、懸浮氣泡與滿版磨砂玻璃聊天室
// @author       YourAICollaborator
// @match        https://www.plurk.com/*
// @grant        unsafeWindow
// @run-at       document-end
// ==/UserScript==

(function() {
    'use strict';

    // 🕵️ 檢查當前網址是否符合你的「許願網址」格式：.../帳號/message
    const urlPath = window.location.pathname;
    const isFullMessagePage = /\/[a-zA-Z0-9_]+\/message\/?/.test(urlPath);

    // ==========================================
    // 🎨 注入 FB Messenger 風格與滿版遮罩的 CSS 樣式
    // ==========================================
    const style = document.createElement('style');
    style.innerHTML = `
        /* 【關鍵修正】如果是在專屬私訊頁面，隱藏噗浪原本的河道主元件，但保留 body 背景圖 */
        ${isFullMessagePage ? `
            #timeline_cnt, #plurk_form, #footer, .plurk_box, #form_holder, #dashboard_holder, .cmp_loading {
                display: none !important;
            }
        ` : ''}

        /* 1. 頂部導航列的私訊按鈕 */
        #plurk-fb-msg-btn {
            position: relative;
            display: inline-block;
            padding: 0 12px;
            cursor: pointer;
            font-weight: bold;
            color: #fff;
            line-height: 40px;
            height: 40px;
            vertical-align: top;
            font-size: 13px;
        }
        #plurk-fb-msg-btn:hover { background: rgba(255,255,255,0.2); }
        #plurk-fb-msg-btn .badge {
            position: absolute;
            top: 4px;
            right: -2px;
            background: #f02849;
            color: white;
            border-radius: 10px;
            padding: 1px 6px;
            font-size: 11px;
            line-height: 12px;
            font-family: Arial, sans-serif;
            display: none;
        }

        /* 2. 頂部點開後的下拉私訊清單選單 */
        #fb-msg-dropdown {
            position: absolute;
            top: 45px;
            width: 360px;
            max-height: 480px;
            background: rgba(255, 255, 255, 0.95);
            backdrop-filter: blur(10px);
            border-radius: 8px;
            box-shadow: 0 12px 28px rgba(0,0,0,0.2);
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
            padding: 6px 12px;
            border-radius: 6px;
            font-size: 12px;
            cursor: pointer;
            font-weight: bold;
        }
        .btn-add-chat:hover { background: #006bf5; }
        .dropdown-list { flex: 1; overflow-y: auto; }
        .dropdown-item {
            display: flex;
            padding: 10px 16px;
            align-items: center;
            cursor: pointer;
            text-decoration: none;
            color: inherit;
            border-bottom: 1px solid rgba(0,0,0,0.03);
        }
        .dropdown-item:hover { background: rgba(0,0,0,0.05); }
        .item-avatar { width: 48px; height: 48px; border-radius: 50%; margin-right: 12px; object-fit: cover; background: #ccc; }
        .item-body { flex: 1; min-width: 0; }
        .item-name { font-weight: bold; font-size: 14px; margin-bottom: 4px; color: #050505; }
        .item-preview { font-size: 12px; color: #65676b; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

        /* 3. 右下角迷你彈出對話框管理區 */
        #fb-chat-container {
            position: fixed;
            bottom: 0;
            right: 90px;
            display: flex;
            align-items: flex-end;
            gap: 12px;
            z-index: 9998;
            pointer-events: none;
        }
        .chat-box {
            width: 285px;
            height: 400px;
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
            padding: 10px 12px;
            font-weight: bold;
            font-size: 13px;
            border-radius: 7px 7px 0 0;
            display: flex;
            justify-content: space-between;
            align-items: center;
            cursor: pointer;
        }
        .chat-ops span { margin-left: 10px; cursor: pointer; opacity: 0.8; font-size: 14px; }
        .chat-ops span:hover { opacity: 1; }
        .chat-messages { flex: 1; padding: 12px; overflow-y: auto; display: flex; flex-direction: column; gap: 8px; background: #f9f9f9; }

        /* 💬 經典對話氣泡 */
        .bubble { max-width: 75%; padding: 8px 12px; border-radius: 16px; font-size: 13px; line-height: 1.4; word-wrap: break-word; }
        .b-them { background: #e4e6eb; color: #050505; align-self: flex-start; border-top-left-radius: 4px; }
        .b-me { background: #0084ff; color: white; align-self: flex-end; border-top-right-radius: 4px; }

        .chat-input-area { padding: 10px; border-top: 1px solid #e4e6eb; background: #fff; }
        .chat-input-area input { width: 100%; box-sizing: border-box; padding: 8px 12px; border-radius: 20px; border: 1px solid #ccd0d5; background: #f0f2f5; font-size: 13px; outline: none; }
        .chat-input-area input:focus { background: #fff; border-color: #0084ff; }

        /* 4. 右側大垂直列的縮小圓形頭貼氣泡區 */
        #fb-bubble-sidebar {
            position: fixed;
            right: 20px;
            bottom: 20px;
            display: flex;
            flex-direction: column;
            gap: 12px;
            z-index: 9999;
        }
        .avatar-bubble {
            position: relative;
            width: 52px;
            height: 52px;
            border-radius: 50%;
            cursor: pointer;
            box-shadow: 0 4px 12px rgba(0,0,0,0.2);
            border: 2px solid #fff;
            background-size: cover;
            background-position: center;
            transition: transform 0.2s;
        }
        .avatar-bubble:hover { transform: scale(1.08); }
        .avatar-bubble .bubble-badge {
            position: absolute;
            top: -2px;
            right: -2px;
            background: #f02849;
            color: white;
            font-size: 11px;
            font-weight: bold;
            border-radius: 10px;
            padding: 1px 5px;
            line-height: 12px;
            border: 2px solid #fff;
        }

        /* 5. 滿版獨立分頁客製化樣式 (高質感半透明磨砂玻璃) */
        #fb-full-page-container {
            display: flex;
            width: 100vw;
            height: 100vh;
            background: rgba(255, 255, 255, 0.4);
            backdrop-filter: blur(8px);
            box-sizing: border-box;
        }
    `;
    document.head.appendChild(style);

    // [第一部分結束，等待第二部分拼接]

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
            <div style="text-align:center; padding:20px; color:#999; font-size:13px;">正在讀取私訊列表...</div>
        </div>
    `;
    document.body.appendChild(msgDropdown);

    // ==========================================
    // 🔗 頂部導航列「私訊」按鈕注入邏輯
    // ==========================================
    function injectTopMenuButton() {
        // 精準鎖定噗浪頂部右側的選單容器 (靠近通知與個人檔案的地方)
        const topBar = document.querySelector('#top_bar .right_items, #nav_menu');
        if (topBar && !document.getElementById('plurk-fb-msg-btn')) {
            const msgBtn = document.createElement('div');
            msgBtn.id = 'plurk-fb-msg-btn';
            msgBtn.innerHTML = `私訊 <span class="badge" id="fb-main-badge">0</span>`;

            // 點擊頂部私訊按鈕，切換下拉選單顯示/隱藏
            msgBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                const isShowing = msgDropdown.style.display === 'flex';
                msgDropdown.style.display = isShowing ? 'none' : 'flex';

                if (!isShowing) {
                    // 讓下拉選單完美對齊私訊按鈕的下方
                    const rect = msgBtn.getBoundingClientRect();
                    msgDropdown.style.top = (rect.bottom + window.scrollY) + 'px';
                    msgDropdown.style.left = (rect.left - 200 + window.scrollX) + 'px';
                }
            });

            // 插入到頂部列的最前方 (大約會在噗幣圖示附近)
            topBar.insertBefore(msgBtn, topBar.firstChild);
        }
    }

    // 噗浪為動態渲染，使用定時器確保即使換頁按鈕依然存在
    setInterval(injectTopMenuButton, 1000);

    // 點擊網頁其他空白處時，自動收起下拉選單
    document.addEventListener('click', () => {
        msgDropdown.style.display = 'none';
    });
    msgDropdown.addEventListener('click', (e) => e.stopPropagation());

    // ==========================================
    // 🕵️ 網址攔截與「Ctrl/中鍵開新分頁」支援核心
    // ==========================================

    // 建立聯絡人超連結節點的通用函式 (同時支援下拉選單與滿版分頁)
    function createChatLinkElement(userId, nickname, avatarUrl, lastText, clickCallback) {
        const item = document.createElement('a');
        item.className = 'dropdown-item';

        // 給予它標準的虛擬真實網址，以便讓滑鼠中鍵、右鍵新分頁、Ctrl+左鍵完全正常運作
        item.href = `https://www.plurk.com/${userId}/message`;

        item.innerHTML = `
            <img class="item-avatar" src="${avatarUrl}" onerror="this.src='https://www.plurk.com/static/default_big.jpg'">
            <div class="item-body">
                <div class="item-name">${nickname}</div>
                <div class="item-preview">${lastText}</div>
            </div>
        `;

        // 攔截滑鼠左鍵點擊
        item.addEventListener('click', (e) => {
            // 如果使用者按住了 Ctrl 鍵、Meta 鍵，或不是用滑鼠左鍵點的，就放行讓瀏覽器自己開新分頁
            if (e.ctrlKey || e.metaKey || e.button !== 0) {
                return;
            }

            // 如果是純左鍵點擊，則阻止預設的網頁跳轉，改在目前頁面右下角呼叫對話框
            e.preventDefault();
            clickCallback();
        });

        return item;
    }

    // [第二部分結束，等待第三部分拼接]

    // 用來追蹤目前右下角開啟的迷你對話框與氣泡狀態
    const activeChats = {};

    // ==========================================
    // 💬 核心：開啟/渲染右下角迷你對話框
    // ==========================================
    window.openMiniChatBox = function(userId, nickname, avatarUrl, plurkId = null) {
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
    };

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

        openMiniChatBox(chat.userId || userId, chat.nickname, chat.avatarUrl, chat.plurkId);
    }

    // ==========================================
    // ➕ 核心：手動輸入使用者 ID 新增對話
    // ==========================================
    document.getElementById('fb-btn-new-chat').addEventListener('click', (e) => {
        e.stopPropagation();
        const targetId = prompt("請輸入想要發起私訊的噗浪使用者 ID (例如: z6423192):");
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
            openMiniChatBox(targetId, targetId, 'https://www.plurk.com/static/default_big.jpg', null);
        }
    });

    // ==========================================
    // 📡 噗浪原生 API 資料對接與撈取（免金鑰密碼）
    // ==========================================

    // A. 串接噗浪內部機制，撈取頂部下拉選單的真實私訊清單 (修正版)
    function fetchPlurkPrivateTimeline() {
        if (!window.jQuery) return;

        // 直接請求噗浪官方的未讀/私訊專用網址，杜絕 400 錯誤，且在任何分頁都能正常運作
        jQuery.ajax({
            url: '/TimeLine/getUnreadPlurks',
            type: 'POST', // 噗浪內部機制偏好 POST 
            dataType: 'json',
            success: function(data) {
                if (!data || !data.plurks) return;

                let res = {
                    plurks: data.plurks.filter(p => p.limited_to && p.limited_to !== 0),
                    plurk_users: data.plurk_users || {}
                };

                const listContainer = document.getElementById('fb-dropdown-user-list');
                if (listContainer) listContainer.innerHTML = '';
        if (listContainer) listContainer.innerHTML = '';
            } // 這是第 484 行的 ajax success 結尾
        }); // 這是補上對應的 ajax 請求結尾
        
        // 這裡就是直接對接你原本的 res.plurks.forEach(plurk => { ... 邏輯了！

        
        if (res.plurks && Array.isArray(res.plurks)) {
            res.plurks = res.plurks.filter(p => p.limited_to && p.limited_to !== 0);
        }

        if (!res || !res.plurks) return;

        const listContainer = document.getElementById('fb-dropdown-user-list');
        if (listContainer) listContainer.innerHTML = '';

                res.plurks.forEach(plurk => {
                    const ownerId = plurk.owner_id;
                    const user = users[ownerId] || {};
                    const userIdStr = user.nick_name || ownerId.toString();
                    const nickname = user.display_name || user.nick_name || "噗友";
                    const avatar = user.avatar ? `https://avatars.plurk.com/${ownerId}-big${user.avatar}.jpg` : 'https://www.plurk.com/static/default_big.jpg';
                    const lastText = plurk.content_raw || "發送了一則私訊...";

                    if (plurk.is_unread === 1) unreadTotal++;

                    // 呼叫第二部分做好的超連結生成元件
                    const itemElement = createChatLinkElement(userIdStr, nickname, avatar, lastText, () => {
                        openMiniChatBox(userIdStr, nickname, avatar, plurk.plurk_id);
                    });

                    if (listContainer) listContainer.appendChild(itemElement);
                });

                // 更新頂部按鈕的未讀數字紅點
                const mainBadge = document.getElementById('fb-main-badge');
                if (mainBadge) {
                    if (unreadTotal > 0) {
                        mainBadge.innerText = unreadTotal;
                        mainBadge.style.display = 'inline-block';
                    } else {
                        mainBadge.style.display = 'none';
                    }
                }

                // 如果目前是在滿版私訊頁面，同步把列表鋪到左側面板
                const fullList = document.getElementById('fb-full-user-list');
                if (isFullMessagePage && fullList && listContainer) {
                    fullList.innerHTML = '';
                    res.plurks.forEach(plurk => {
                        const ownerId = plurk.owner_id;
                        const user = users[ownerId] || {};
                        const userIdStr = user.nick_name || ownerId.toString();
                        const nickname = user.display_name || user.nick_name || "噗友";
                        const avatar = user.avatar ? `https://avatars.plurk.com/${ownerId}-big${user.avatar}.jpg` : 'https://www.plurk.com/static/default_big.jpg';
                        const lastText = plurk.content_raw || "發送了一則私訊...";

                        const fullItem = createChatLinkElement(userIdStr, nickname, avatar, lastText, () => {
                            document.getElementById('fb-full-chat-header').innerText = nickname;
                            document.getElementById('fb-full-input-area').style.display = 'block';

                            const mainInput = document.getElementById('fb-full-main-input');
                            mainInput.onkeydown = (e) => {
                                if (e.key === 'Enter' && mainInput.value.trim() !== '') {
                                    sendPrivateMessage(userIdStr, mainInput.value.trim(), plurk.plurk_id);
                                    mainInput.value = '';
                                    setTimeout(() => { loadFullPageChat(plurk.plurk_id); }, 500);
                                }
                            };

                            loadFullPageChat(plurk.plurk_id);
                        });
                        fullList.appendChild(fullItem);
            });
        } }); // <-- 補上這兩個，用來關閉 success 函式與 ajax 請求
    }

    // B. 真實載入右下角迷你對話紀錄
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
                msgArea.innerHTML = '';
                if (res.plurk) {
                    const isMe = res.plurk.owner_id == window.SITE_USER_ID;
                    const bubble = document.createElement('div');
                    bubble.className = `bubble ${isMe ? 'b-me' : 'b-them'}`;
                    bubble.innerText = res.plurk.content_raw;
                    msgArea.appendChild(bubble);
                }
                if (res.responses) {
                    res.responses.forEach(resp => {
                        const isMe = resp.user_id == window.SITE_USER_ID;
                        const bubble = document.createElement('div');
                        bubble.className = `bubble ${isMe ? 'b-me' : 'b-them'}`;
                        bubble.innerText = resp.content_raw;
                        msgArea.appendChild(bubble);
                    });
                }
                msgArea.scrollTop = msgArea.scrollHeight;
            }
        });
    };

    // C. 專為滿版大畫面設計的訊息載入器
    function loadFullPageChat(plurkId) {
        const fullBody = document.getElementById('fb-full-chat-body');
        if (!fullBody) return;

        jQuery.ajax({
            url: '/APP/Responses/get',
            type: 'GET',
            data: { plurk_id: plurkId },
            dataType: 'json',
            success: function(res) {
                fullBody.innerHTML = '';
                if (res.plurk) {
                    const isMe = res.plurk.owner_id == window.SITE_USER_ID;
                    const bubble = document.createElement('div');
                    bubble.className = `bubble ${isMe ? 'b-me' : 'b-them'}`;
                    bubble.style.fontSize = '15px';
                    bubble.style.padding = '10px 16px';
                    bubble.innerText = res.plurk.content_raw;
                    fullBody.appendChild(bubble);
                }
                if (res.responses) {
                    res.responses.forEach(resp => {
                        const isMe = resp.user_id == window.SITE_USER_ID;
                        const bubble = document.createElement('div');
                        bubble.className = `bubble ${isMe ? 'b-me' : 'b-them'}`;
                        bubble.style.fontSize = '15px';
                        bubble.style.padding = '10px 16px';
                        bubble.innerText = resp.content_raw;
                        fullBody.appendChild(bubble);
                    });
                }
                fullBody.scrollTop = fullBody.scrollHeight;
            }
        });
    }

    // D. 串接發送私訊 API
    function sendPrivateMessage(userId, text, plurkId) {
        if (!plurkId) {
            jQuery.ajax({
                url: '/APP/Timeline/plurkAdd',
                type: 'POST',
                data: { content: text, qualifier: ':', limited_to: JSON.stringify([userId]) },
                dataType: 'json',
                success: function(res) {
                    if (res && res.plurk_id) {
                        if(activeChats[userId]) activeChats[userId].plurkId = res.plurk_id;
                        loadChatMessages(userId, res.plurk_id);
                        fetchPlurkPrivateTimeline();
                    }
                }
            });
        } else {
            jQuery.ajax({
                url: '/APP/Responses/responseAdd',
                type: 'POST',
                data: { plurk_id: plurkId, content: text, qualifier: ':' },
                dataType: 'json',
                success: function() {
                    loadChatMessages(userId, plurkId);
                    fetchPlurkPrivateTimeline();
                }
            });
        }
    }

    // 啟動與常駐輪詢
    setTimeout(fetchPlurkPrivateTimeline, 1500);
    setInterval(fetchPlurkPrivateTimeline, 20000);

    // ==========================================
    // 🖥️ 專屬虛擬 /message 網址的滿版魔改渲染 (優化版：不卡死死白)
    // ==========================================
    if (isFullMessagePage) {
        const fullPageContainer = document.createElement('div');
        fullPageContainer.id = 'fb-full-page-container';
        fullPageContainer.innerHTML = `
            <div style="width:340px; background:rgba(255,255,255,0.9); border-right:1px solid #ccd0d5; display:flex; flex-direction:column; height:100%;">
                <div style="padding:18px 16px; font-size:20px; font-weight:bold; border-bottom:1px solid #e4e6eb; color:#050505;">專屬私訊分頁</div>
                <div class="dropdown-list" id="fb-full-user-list" style="flex:1; overflow-y:auto;">
                    <div style="text-align:center; padding:20px; color:#666; font-size:13px;">正在同步私訊河道...</div>
                </div>
            </div>
            <div style="flex:1; display:flex; flex-direction:column; height:100%;">
                <div id="fb-full-chat-header" style="padding:18px 24px; font-weight:bold; font-size:16px; border-bottom:1px solid #ccd0d5; background:#fff; color:#050505;">請選擇左側聯絡人發起聊天</div>
                <div class="chat-messages" id="fb-full-chat-body" style="flex:1; padding:24px; background:transparent;"></div>
                <div class="chat-input-area" id="fb-full-input-area" style="display:none; padding:16px; background:#fff; border-top:1px solid #e4e6eb;">
                    <input type="text" id="fb-full-main-input" placeholder="輸入訊息...">
                </div>
            </div>
        `;

        // 確保在 DOM 完全載入後才加載滿版視窗
        if (document.body) {
            document.body.appendChild(fullPageContainer);
        } else {
            window.addEventListener('DOMContentLoaded', () => { document.body.appendChild(fullPageContainer); });
        }
    }

})();
