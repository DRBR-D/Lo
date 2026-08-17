// ==================== CẤU HÌNH GITHUB ====================
// ⚠️ Thay thế thông tin của bạn tại đây:
const GITHUB_USERNAME = "USER_NAME_CUA_BAN";
const GITHUB_REPO     = "TEN_REPO_CUA_BAN";
const GITHUB_FOLDER   = "images";

// Tạo Personal Access Token (Fine-grained hoặc Classic với quyền 'repo')
// Dán token của bạn vào đây (Lưu ý: Chỉ dùng token này cho repo riêng tư / nhóm 3 người chơi thân)
const GITHUB_TOKEN    = "ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx";
// ==========================================================

const API_URL = `https://api.github.com/repos/${GITHUB_USERNAME}/${GITHUB_REPO}/contents/${GITHUB_FOLDER}`;

// Tải danh sách ảnh khi trang web load xong
document.addEventListener("DOMContentLoaded", loadGallery);

// 1. Hàm hiển thị danh sách ảnh từ folder images/
async function loadGallery() {
    const gallery = document.getElementById("gallery");
    gallery.innerHTML = "<p>Đang tải danh sách ảnh...</p>";

    try {
        const response = await fetch(API_URL, {
            headers: {
                "Authorization": `token ${GITHUB_TOKEN}`,
                "Accept": "application/vnd.github.v3+json"
            }
        });

        if (!response.ok) throw new Error("Không thể kết nối đến GitHub API");

        const files = await response.json();
        gallery.innerHTML = "";

        // Lọc và chỉ lấy các file định dạng hình ảnh
        const imageFiles = files.filter(file => file.name.match(/\.(jpg|jpeg|png|gif|webp)$/i));

        if (imageFiles.length === 0) {
            gallery.innerHTML = "<p>Chưa có hình ảnh nào trong thư mục!</p>";
            return;
        }

        imageFiles.reverse().forEach(file => {
            const card = document.createElement("div");
            card.className = "img-card";

            const img = document.createElement("img");
            img.src = file.download_url;
            img.alt = file.name;
            img.loading = "lazy";

            // Click vào ảnh để mở tab mới xem ảnh gốc
            card.onclick = () => window.open(file.download_url, "_blank");

            card.appendChild(img);
            gallery.appendChild(card);
        });

    } catch (error) {
        console.error(error);
        gallery.innerHTML = "<p style='color: #ef4444;'>Lỗi khi tải ảnh. Kiểm tra lại cấu hình TOKEN / Repo!</p>";
    }
}

// 2. Hàm chuyển file sang Base64 để gửi qua API
function fileToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result.split(',')[1]); // Lấy đoạn mã Base64 bỏ phần header
        reader.onerror = error => reject(error);
    });
}

// 3. Hàm Upload ảnh trực tiếp lên Repo GitHub
async function uploadImage() {
    const fileInput = document.getElementById("imageInput");
    const uploadBtn = document.getElementById("uploadBtn");
    const statusMsg = document.getElementById("statusMessage");

    if (fileInput.files.length === 0) {
        alert("Vui lòng chọn 1 hình ảnh!");
        return;
    }

    const file = fileInput.files[0];
    
    // Đặt tên file độc nhất bằng timestamp để không bị trùng tên
    const fileName = `${Date.now()}_${file.name.replace(/\s+/g, '_')}`;
    const uploadUrl = `${API_URL}/${fileName}`;

    try {
        uploadBtn.disabled = true;
        statusMsg.style.color = "#3b82f6";
        statusMsg.innerText = "Đang đẩy ảnh lên GitHub...";

        const contentBase64 = await fileToBase64(file);

        const response = await fetch(uploadUrl, {
            method: "PUT",
            headers: {
                "Authorization": `token ${GITHUB_TOKEN}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                message: `Upload ảnh: ${fileName}`,
                content: contentBase64
            })
        });

        if (response.ok) {
            statusMsg.style.color = "#10b981";
            statusMsg.innerText = "Upload ảnh thành công!";
            fileInput.value = ""; // Reset khung chọn file
            setTimeout(loadGallery, 1500); // Load lại gallery để hiển thị ảnh mới
        } else {
            const errData = await response.json();
            throw new Error(errData.message || "Upload thất bại");
        }

    } catch (error) {
        console.error(error);
        statusMsg.style.color = "#ef4444";
        statusMsg.innerText = `Lỗi upload: ${error.message}`;
    } finally {
        uploadBtn.disabled = false;
    }
}