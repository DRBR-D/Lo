// ==================== CẤU HÌNH CLOUDINARY ====================
const CLOUD_NAME    = "dxiuwrick"; 
const UPLOAD_PRESET = "my_preset"; 
// ============================================================

const UPLOAD_URL = `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`;
const LIST_URL   = `https://res.cloudinary.com/${CLOUD_NAME}/image/list/v1.json`;

// Tải danh sách ảnh khi trang web load
document.addEventListener("DOMContentLoaded", loadGallery);

// 1. Hàm Upload ảnh trực tiếp lên Cloudinary
async function uploadImage() {
    const fileInput = document.getElementById("imageInput");
    const uploadBtn = document.getElementById("uploadBtn");
    const statusMsg = document.getElementById("statusMessage");

    if (fileInput.files.length === 0) {
        alert("Vui lòng chọn 1 hình ảnh!");
        return;
    }

    const file = fileInput.files[0];
    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", UPLOAD_PRESET);

    try {
        uploadBtn.disabled = true;
        statusMsg.style.color = "#3b82f6";
        statusMsg.innerText = "Đang tải ảnh lên Cloudinary...";

        const response = await fetch(UPLOAD_URL, {
            method: "POST",
            body: formData
        });

        const data = await response.json();

        if (response.ok) {
            statusMsg.style.color = "#10b981";
            statusMsg.innerText = "Upload ảnh thành công!";
            fileInput.value = "";
            
            // Hiển thị ngay ảnh vừa upload lên giao diện
            appendImageToGallery(data.secure_url);
        } else {
            throw new Error(data.error?.message || "Upload thất bại");
        }

    } catch (error) {
        console.error(error);
        statusMsg.style.color = "#ef4444";
        statusMsg.innerText = `Lỗi upload: ${error.message}`;
    } finally {
        uploadBtn.disabled = false;
    }
}

// 2. Hàm thêm ảnh vào giao diện
function appendImageToGallery(url) {
    const gallery = document.getElementById("gallery");
    
    // Xóa chữ "Chưa có ảnh" nếu có
    if (gallery.querySelector("p")) {
        gallery.innerHTML = "";
    }

    const card = document.createElement("div");
    card.className = "img-card";

    const img = document.createElement("img");
    img.src = url;
    img.loading = "lazy";
    card.onclick = () => window.open(url, "_blank");

    card.appendChild(img);
    gallery.insertBefore(card, gallery.firstChild); // Đưa ảnh mới nhất lên đầu
}

// 3. Khởi tạo kho trống nếu mới dùng
function loadGallery() {
    const gallery = document.getElementById("gallery");
    gallery.innerHTML = "<p>Chọn và upload ảnh để chia sẻ với mọi người!</p>";
}