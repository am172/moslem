let qaList = [];
let fuse;
// إعدادات Fuse.js للبحث بدقة أكبر
const options = {
    includeScore: true,
    threshold: 0.7,  // تقليل قيمة العتبة لزيادة دقة التطابق
    keys: ['question']
};

fuse = new Fuse(qaList, options);

// تحميل البيانات من ملف JSON
fetch('qa-data.json')
    .then(response => response.json())
    .then(data => {
        qaList = data;
        // إعداد Fuse.js للبحث التقريبي
        const options = {
            includeScore: true,
            keys: ['question']
        };
        fuse = new Fuse(qaList, options);
        // استرجاع السجل عند تحميل الصفحة
        loadChatHistory();
    })
    .catch(error => console.error('Error loading QA data:', error));


function typeWriter(element, text, speed = 50, callback) {
    let i = 0;
    const intervalId = setInterval(() => {
        if (i < text.length) {
            element.textContent += text.charAt(i);
            i++;
        } else {
            clearInterval(intervalId);
            if (callback) callback();
        }
    }, speed);
}
function sendMessage() {
    const userInput = document.getElementById('user-input').value;
    const chatBody = document.getElementById('chat-body');

    if (userInput.trim() === '') return;

    // إضافة رسالة المستخدم
    const userMessage = document.createElement('div');
    userMessage.className = 'message user-message';
    userMessage.textContent = userInput;
    chatBody.appendChild(userMessage);

    // إضافة رسالة البوت
    const botMessage = document.createElement('div');
    botMessage.className = 'message bot-message';
    botMessage.textContent = ''; // البداية بدون نص

    // إضافة أيقونة حذف بجانب الرسالة
    const deleteButton = document.createElement('button');
    deleteButton.className = 'delete-btn';
    const icon = document.createElement('i');
    icon.className = 'fas fa-trash'; // أيقونة الحذف من Font Awesome
    deleteButton.appendChild(icon);
    deleteButton.onclick = () => deleteMessage(userMessage, botMessage);

    botMessage.appendChild(deleteButton);
    chatBody.appendChild(botMessage);

    // الحصول على رد البوت
    const response = getBotResponse(userInput);

    // استخدام دالة typeWriter لكتابة الرد تدريجيًا
    typeWriter(botMessage, response, 50, () => {
        // حفظ الرسائل في localStorage بعد الانتهاء من الكتابة
        saveChatHistory(userInput, response);

        // تنظيف حقل الإدخال
        document.getElementById('user-input').value = '';

        // تمرير إلى الأسفل لتحديث الرسائل الجديدة
        chatBody.scrollTop = chatBody.scrollHeight;
    });
}


function getBotResponse(question) {
    if (!fuse) return 'عذرًا، لا أستطيع تقديم إجابة على هذا السؤال.';

    // البحث باستخدام Fuse.js
    const result = fuse.search(question);
    const bestMatch = result.length > 0 ? result[0].item : null;

    // إذا لم يتم العثور على تطابق، استخدام رد افتراضي
    return bestMatch ? bestMatch.answer : 'عذرًا، لا أستطيع تقديم إجابة على هذا السؤال. يرجى طرح سؤال آخر.';
}

function saveChatHistory(userMessage, botMessage) {
    let history = JSON.parse(localStorage.getItem('chatHistory')) || [];
    history.push({ userMessage, botMessage });
    localStorage.setItem('chatHistory', JSON.stringify(history));
}

function loadChatHistory() {
    let history = JSON.parse(localStorage.getItem('chatHistory')) || [];
    const chatBody = document.getElementById('chat-body');
    chatBody.innerHTML = ''; // تنظيف المحتوى الحالي
    history.forEach(item => {
        const userMessage = document.createElement('div');
        userMessage.className = 'message user-message';
        userMessage.textContent = item.userMessage;
        chatBody.appendChild(userMessage);

        const botMessage = document.createElement('div');
        botMessage.className = 'message bot-message';
        botMessage.textContent = item.botMessage;

        // إضافة أيقونة حذف بجانب الرسالة
        const deleteButton = document.createElement('button');
        deleteButton.className = 'delete-btn';
        const icon = document.createElement('i');
        icon.className = 'fas fa-trash'; // أيقونة الحذف من Font Awesome
        deleteButton.appendChild(icon);
        deleteButton.onclick = () => deleteMessage(userMessage, botMessage);

        botMessage.appendChild(deleteButton);
        chatBody.appendChild(botMessage);
    });
}

function deleteMessage(userMessage, botMessage) {
    // حذف الرسائل من الواجهة
    userMessage.remove();
    botMessage.remove();

    // تحديث السجل في localStorage
    let history = JSON.parse(localStorage.getItem('chatHistory')) || [];
    history = history.filter(item => item.userMessage !== userMessage.textContent || item.botMessage !== botMessage.textContent);
    localStorage.setItem('chatHistory', JSON.stringify(history));
}

function clearChat() {
    // حذف السجل بالكامل
    localStorage.removeItem('chatHistory');
    document.getElementById('chat-body').innerHTML = '';
}

function deleteLastMessage() {
    let history = JSON.parse(localStorage.getItem('chatHistory')) || [];
    if (history.length > 0) {
        history.pop(); // حذف آخر عنصر
        localStorage.setItem('chatHistory', JSON.stringify(history));
        loadChatHistory(); // تحديث الواجهة بعد الحذف
    }
}

// إضافة مستمع لحدث keydown على حقل الإدخال
document.getElementById('user-input').addEventListener('keydown', function (event) {
    if (event.key === 'Enter') {
        event.preventDefault(); // منع التصرف الافتراضي
        sendMessage(); // استدعاء دالة إرسال الرسالة
    }
});


document.addEventListener('DOMContentLoaded', () => {
    const toggleButton = document.getElementById('toggle-night-mode');
    const darkModeClass = 'dark-mode';

    // تحقق من حالة الوضع المظلم المحفوظ في التخزين المحلي
    if (localStorage.getItem('theme') === 'dark') {
        document.body.classList.add(darkModeClass);
    }

    toggleButton.addEventListener('click', () => {
        document.body.classList.toggle(darkModeClass);

        // حفظ الحالة الحالية في التخزين المحلي
        if (document.body.classList.contains(darkModeClass)) {
            localStorage.setItem('theme', 'dark');
        } else {
            localStorage.setItem('theme', 'light');
        }
    });
});

