// ==================== CẤU HÌNH CLOUDINARY ====================
// Thay Cloud Name lấy từ trang Dashboard Cloudinary của bạn:
const CLOUD_NAME    = "dxiuwrick"; 

// Preset name bạn tạo trên Cloudinary (Ví dụ: my_preset):
const UPLOAD_PRESET = "my_preset"; 
// ============================================================

const UPLOAD_URL = `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`;

// Khởi tạo gallery khi load trang
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
            
            // Lưu URL ảnh vào bộ nhớ trình duyệt local
            saveImageUrl(data.secure_url);

            // Hiển thị ngay ảnh mới lên đầu gallery
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

// 2. Lưu danh sách URL ảnh vào LocalStorage để không bị mất khi F5
function saveImageUrl(url) {
    let images = JSON.parse(localStorage.getItem("MY_GALLERY_IMAGES") || "[]");
    images.unshift(url);
    localStorage.setItem("MY_GALLERY_IMAGES", JSON.stringify(images));
}

// 3. Hàm render 1 thẻ ảnh ra màn hình
function appendImageToGallery(url) {
    const gallery = document.getElementById("gallery");
    
    // Xóa dòng thông báo chưa có ảnh nếu có
    const emptyMsg = gallery.querySelector(".empty-msg");
    if (emptyMsg) {
        gallery.innerHTML = "";
    }

    const card = document.createElement("div");
    card.className = "img-card";

    const img = document.createElement("img");
    img.src = url;
    img.loading = "lazy";
    
    // Click vào để mở ảnh gốc full size ở tab mới
    card.onclick = () => window.open(url, "_blank");

    card.appendChild(img);
    gallery.insertBefore(card, gallery.firstChild); // Đưa ảnh mới tải lên trên cùng
}

// 4. Load lại toàn bộ ảnh cũ đã lưu khi mở trang
function loadGallery() {
    const gallery = document.getElementById("gallery");
    let images = JSON.parse(localStorage.getItem("MY_GALLERY_IMAGES") || "[]");

    if (images.length === 0) {
        gallery.innerHTML = "<p class='empty-msg'>Chưa có ảnh nào. Hãy chọn file và bấm Upload!</p>";
        return;
    }

    gallery.innerHTML = "";
    images.forEach(url => {
        const card = document.createElement("div");
        card.className = "img-card";

        const img = document.createElement("img");
        img.src = url;
        img.loading = "lazy";
        card.onclick = () => window.open(url, "_blank");

        card.appendChild(img);
        gallery.appendChild(card);
    });
}