// ==UserScript==
// @name         PlurkMessage
// @version      1.0
// @description  噗浪私訊功能增強
// @author       GCouo
// @match        https://www.plurk.com/*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    // 檢查 jQuery 是否就緒
    if (!window.jQuery) return;

    // 基礎 CSS 設定
    const style = document.createElement('style');
    style.innerHTML = `
        .fb-dropdown-item { padding: 5px; border-bottom: 1px solid #ccc; cursor: pointer; display: flex; align-items: center; }
        .fb-dropdown-item:hover { background: #f0f0f0; }
        .fb-avatar { width: 30px; height: 30px; margin-right: 10px; border-radius: 3px; }
    `;
    document.head.appendChild(style);

    // 建立私訊連結元素的通用函式
    function createChatLinkElement(userId, nickname, avatar, lastText) {
        const div = document.createElement('div');
        div.className = 'fb-dropdown-item';
        div.innerHTML = `<img src="${avatar}" class="fb-avatar"> <div><strong>${nickname}</strong><br><small>${lastText}</small></div>`;
        div.onclick = () => window.location.href = `https://www.plurk.com/${userId}/message`;
        return div;
    }

    // 請求並處理噗浪私訊 API 的核心函式
    function fetchPlurkPrivateTimeline() {
        const targetWindow = typeof unsafeWindow !== 'undefined' ? unsafeWindow : window;
        const nonce = (targetWindow.GLOBAL && targetWindow.GLOBAL.req_nonce) || '';

        fetch('/TimeLine/getUnreadPlurks', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: `req_nonce=${encodeURIComponent(nonce)}`
        })
        .then(response => response.json())
        .then(data => {
            if (!data || !data.plurks) return;

            // 過濾出包含 limited_to 的私訊噗
            let res = {
                plurks: data.plurks.filter(p => p.limited_to && p.limited_to !== 0),
                plurk_users: data.plurk_users || {}
            };

            const users = res.plurk_users;
            const listContainer = document.getElementById('fb-dropdown-user-list');

            if (listContainer) {
                listContainer.innerHTML = '';
                res.plurks.forEach(plurk => {
                    const ownerId = plurk.owner_id;
                    const user = users[ownerId] || {};
                    const userIdStr = user.nick_name || ownerId.toString();
                    const nickname = user.display_name || user.nick_name || "噗友";
                    const avatar = user.avatar ? `https://avatars.plurk.com/${ownerId}-big${user.avatar}.gif` : 'https://www.plurk.com/static/default_avatar_big.gif';
                    const lastText = plurk.content_raw || "發送了一則私訊...";

                    const item = createChatLinkElement(userIdStr, nickname, avatar, lastText);
                    listContainer.appendChild(item);
                });
            }
        })
        .catch(err => console.error("撈取噗浪私訊失敗:", err));
    }

    // 初始化 UI 佈局的函式
    function initChatLayout() {
        // 在這裡加入你原本建立 UI 的邏輯，例如建立下拉選單容器
        // 如果原本已經有這段程式碼，請確保它在這裡定義
        if (!document.getElementById('fb-dropdown-user-list')) {
            const container = document.createElement('div');
            container.id = 'fb-dropdown-user-list';
            document.body.appendChild(container);
        }
    }

    // 執行點火指令
    initChatLayout();
    fetchPlurkPrivateTimeline();

})(); // 這裡是整個 IIFE 的結尾，補上這個叉叉就會消失！

// B. 真實載入右下角迷你對話紀錄 (之後接你原本的 B 區塊程式碼)

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
