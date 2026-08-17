import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getDatabase, ref, push, onValue, remove } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js";

// Config Firebase của dự án "menu"
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

const app = initializeApp(firebaseConfig);
const database = getDatabase(app);
const photosRef = ref(database, 'photos');

let currentActiveKey = null;
let currentActiveBase64 = null;

// 1. Lắng nghe danh sách ảnh Real-time từ Firebase Database
onValue(photosRef, (snapshot) => {
    const gallery = document.getElementById("gallery");
    const photoCount = document.getElementById("photoCount");
    gallery.innerHTML = "";

    const data = snapshot.val();
    if (!data) {
        photoCount.innerText = "0 ảnh";
        gallery.innerHTML = "<div class='empty-box'>Chưa có khoảnh khắc nào. Hãy tải bức ảnh đầu tiên lên!</div>";
        return;
    }

    // Chuyển dữ liệu sang mảng kèm ID Key để xử lý xóa/tải
    const items = Object.keys(data).map(key => ({
        key: key,
        ...data[key]
    })).reverse(); // Mới nhất lên đầu

    photoCount.innerText = `${items.length} ảnh`;

    items.forEach((item) => {
        const card = document.createElement("div");
        card.className = "img-card";

        const img = document.createElement("img");
        img.src = item.base64;
        img.loading = "lazy";

        card.onclick = () => openModal(item.key, item.base64);

        card.appendChild(img);
        gallery.appendChild(card);
    });
}, (error) => {
    console.error("Firebase Error:", error);
});

// 2. Mở Modal xem ảnh
function openModal(key, base64) {
    currentActiveKey = key;
    currentActiveBase64 = base64;
    
    const modal = document.getElementById("imageModal");
    const modalImg = document.getElementById("modalImage");
    
    modalImg.src = base64;
    modal.classList.add("active");
    document.body.style.overflow = "hidden"; // Chống cuộn trang phía sau
}

// 3. Đóng Modal (Nút Back)
window.closeModal = function() {
    const modal = document.getElementById("imageModal");
    modal.classList.remove("active");
    document.body.style.overflow = "auto";
    currentActiveKey = null;
    currentActiveBase64 = null;
};

// 4. Tính năng Tải Ảnh về Máy
window.downloadCurrentImage = function() {
    if (!currentActiveBase64) return;
    
    const a = document.createElement("a");
    a.href = currentActiveBase64;
    a.download = `photo_${Date.now()}.jpg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
};

// 5. Tính năng Xóa Ảnh (Xóa trực tiếp trên Firebase)
window.deleteCurrentImage = async function() {
    if (!currentActiveKey) return;
    
    const confirmDelete = confirm("Bạn có chắc chắn muốn xóa bức ảnh này không?");
    if (!confirmDelete) return;

    try {
        const targetRef = ref(database, `photos/${currentActiveKey}`);
        await remove(targetRef);
        closeModal();
    } catch (err) {
        alert("Lỗi khi xóa ảnh: " + err.message);
    }
};

// 6. Nén ảnh giữ độ nét cao và Upload lên Firebase
function convertFileToBase64(file, maxWidth = 1200) {
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
                resolve(canvas.toDataURL("image/jpeg", 0.75));
            };
            img.onerror = (err) => reject(err);
        };
        reader.onerror = (err) => reject(err);
    });
}

window.uploadImage = async function() {
    const fileInput = document.getElementById("imageInput");
    const uploadBtn = document.getElementById("uploadBtn");
    const statusMsg = document.getElementById("statusMessage");

    if (fileInput.files.length === 0) {
        alert("Vui lòng chọn 1 bức ảnh!");
        return;
    }

    const file = fileInput.files[0];

    try {
        uploadBtn.disabled = true;
        statusMsg.style.color = "#38bdf8";
        statusMsg.innerText = "Đang tối ưu và tải ảnh lên...";

        const base64String = await convertFileToBase64(file);

        await push(photosRef, {
            base64: base64String,
            createdAt: Date.now()
        });

        statusMsg.style.color = "#10b981";
        statusMsg.innerText = "Tải ảnh lên thành công!";
        fileInput.value = "";

    } catch (error) {
        console.error(error);
        statusMsg.style.color = "#ef4444";
        statusMsg.innerText = `Lỗi: ${error.message}`;
    } finally {
        uploadBtn.disabled = false;
    }
};