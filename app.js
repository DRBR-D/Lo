// Import SDK Firebase v10
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getDatabase, ref, push, onValue } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js";

// Thông tin cấu hình Firebase
const firebaseConfig = {
    apiKey: "AIzaSyA5o5FjDgTiYtHw8uaK6_eXxAZ6Go2Ppew",
    authDomain: "menu-bcf7e.firebaseapp.com",
    databaseURL: "https://menu-bcf7e-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "menu-bcf7e",
    storageBucket: "menu-bcf7e.firebasestorage.app",
    messagingSenderId: "998669598735",
    appId: "1:998669598735:web:6525a36ffcdfdfadad637a",
    measurementId: "G-7LVTQL5BN8"
};

// Khởi tạo Firebase
const app = initializeApp(firebaseConfig);
const database = getDatabase(app);
const photosRef = ref(database, 'photos');

// 1. Lắng nghe dữ liệu Realtime và hiển thị ảnh
onValue(photosRef, (snapshot) => {
    const gallery = document.getElementById("gallery");
    gallery.innerHTML = "";

    const data = snapshot.val();
    if (!data) {
        gallery.innerHTML = "<p class='empty-msg'>Chưa có ảnh nào. Bấm chọn file để tải lên nhé!</p>";
        return;
    }

    // Đảo ngược mảng để ảnh mới nhất xuất hiện trên đầu
    const items = Object.values(data).reverse();

    items.forEach((item) => {
        const card = document.createElement("div");
        card.className = "img-card";

        const img = document.createElement("img");
        img.src = item.base64;
        img.loading = "lazy";
        
        // Bấm vào ảnh để xem kích thước đầy đủ
        card.onclick = () => {
            const w = window.open("");
            w.document.write(`<body style="margin:0; background:#121212; display:flex; justify-content:center; align-items:center; min-height:100vh;"><img src="${item.base64}" style="max-width:90%; max-height:90vh; border-radius:8px;"></body>`);
        };

        card.appendChild(img);
        gallery.appendChild(card);
    });
}, (error) => {
    console.error("Lỗi kết nối Firebase:", error);
    const statusMsg = document.getElementById("statusMessage");
    if (statusMsg) {
        statusMsg.style.color = "#ef4444";
        statusMsg.innerText = "Lỗi kết nối Realtime Database! Kiểm tra lại Rules.";
    }
});

// 2. Hàm tự động nén ảnh và chuyển thành Base64
function convertFileToBase64(file, maxWidth = 800) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (event) => {
            const img = new Image();
            img.src = event.target.result;
            img.onload = () => {
                const canvas = document.createElement("canvas");
                let width = img.width;
                let height = img.height;

                if (width > maxWidth) {
                    height = Math.round((height * maxWidth) / width);
                    width = maxWidth;
                }

                canvas.width = width;
                canvas.height = height;

                const ctx = canvas.getContext("2d");
                ctx.drawImage(img, 0, 0, width, height);
                // Nén ảnh chất lượng 0.7 JPEG giúp dung lượng cực nhẹ
                resolve(canvas.toDataURL("image/jpeg", 0.7));
            };
            img.onerror = (err) => reject(err);
        };
        reader.onerror = (err) => reject(err);
    });
}

// 3. Hàm Upload đưa dữ liệu lên Realtime Database
window.uploadImage = async function() {
    const fileInput = document.getElementById("imageInput");
    const uploadBtn = document.getElementById("uploadBtn");
    const statusMsg = document.getElementById("statusMessage");

    if (fileInput.files.length === 0) {
        alert("Vui lòng chọn 1 hình ảnh!");
        return;
    }

    const file = fileInput.files[0];

    try {
        uploadBtn.disabled = true;
        statusMsg.style.color = "#3b82f6";
        statusMsg.innerText = "Đang xử lý và tải ảnh lên...";

        // Nén và chuyển đổi ảnh
        const base64String = await convertFileToBase64(file);

        // Đẩy lên Firebase Realtime Database
        await push(photosRef, {
            base64: base64String,
            createdAt: Date.now()
        });

        statusMsg.style.color = "#10b981";
        statusMsg.innerText = "Upload ảnh thành công!";
        fileInput.value = "";

    } catch (error) {
        console.error("Upload Error:", error);
        statusMsg.style.color = "#ef4444";
        statusMsg.innerText = `Lỗi: ${error.message}`;
    } finally {
        uploadBtn.disabled = false;
    }
};
