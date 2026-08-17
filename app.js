// Import các SDK Firebase từ CDN (Dùng phiên bản v10 mượt định dạng ES Module)
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getStorage, ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-storage.js";
import { getFirestore, collection, addDoc, query, orderBy, onSnapshot } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// Thông tin Firebase Config của mày
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

// Khởi tạo ứng dụng Firebase
const app = initializeApp(firebaseConfig);
const storage = getStorage(app);
const db = getFirestore(app);

const photosCollection = collection(db, "photos");

// 1. Lắng nghe danh sách ảnh Real-time từ Firestore
const q = query(photosCollection, orderBy("createdAt", "desc"));
onSnapshot(q, (snapshot) => {
    const gallery = document.getElementById("gallery");
    gallery.innerHTML = "";

    if (snapshot.empty) {
        gallery.innerHTML = "<p class='empty-msg'>Chưa có ảnh nào. Bấm chọn file để tải lên nhé!</p>";
        return;
    }

    snapshot.forEach((doc) => {
        const data = doc.data();
        const card = document.createElement("div");
        card.className = "img-card";

        const img = document.createElement("img");
        img.src = data.url;
        img.loading = "lazy";
        
        // Click để xem ảnh gốc ở tab mới
        card.onclick = () => window.open(data.url, "_blank");

        card.appendChild(img);
        gallery.appendChild(card);
    });
}, (error) => {
    console.error("Lỗi Realtime:", error);
});

// 2. Hàm Upload ảnh lên Firebase Storage & Lưu Link vào Database
window.uploadImage = async function() {
    const fileInput = document.getElementById("imageInput");
    const uploadBtn = document.getElementById("uploadBtn");
    const statusMsg = document.getElementById("statusMessage");

    if (fileInput.files.length === 0) {
        alert("Vui lòng chọn 1 hình ảnh!");
        return;
    }

    const file = fileInput.files[0];
    const fileName = `${Date.now()}_${file.name.replace(/\s+/g, '_')}`;
    const storageRef = ref(storage, `images/${fileName}`);

    try {
        uploadBtn.disabled = true;
        statusMsg.style.color = "#3b82f6";
        statusMsg.innerText = "Đang tải ảnh lên Firebase...";

        // Push file ảnh lên Firebase Storage
        await uploadBytes(storageRef, file);
        
        // Lấy link đường dẫn ảnh công khai
        const downloadURL = await getDownloadURL(storageRef);

        // Lưu đường link ảnh vào Firestore để sync real-time cho 3 người
        await addDoc(photosCollection, {
            url: downloadURL,
            createdAt: new Date()
        });

        statusMsg.style.color = "#10b981";
        statusMsg.innerText = "Upload ảnh thành công!";
        fileInput.value = "";

    } catch (error) {
        console.error(error);
        statusMsg.style.color = "#ef4444";
        statusMsg.innerText = `Lỗi: ${error.message}`;
    } finally {
        uploadBtn.disabled = false;
    }
};
