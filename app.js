// ==================== CẤU HÌNH GITHUB ====================
// ⚠️ Không lưu token trực tiếp trong mã nguồn. Token nên được nhập thủ công
// ở giao diện hoặc lưu trong localStorage của trình duyệt.
const GITHUB_USERNAME = "DRBR-D";
const GITHUB_REPO     = "Lo";
const GITHUB_FOLDER   = "images";
const TOKEN_STORAGE_KEY = "github_pat_lo";
// ==========================================================

const API_URL = `https://api.github.com/repos/${GITHUB_USERNAME}/${GITHUB_REPO}/contents/${GITHUB_FOLDER}`;

function getGithubToken() {
    return (localStorage.getItem(TOKEN_STORAGE_KEY) || "").trim();
}

function saveGithubToken(token) {
    const cleanToken = (token || "").trim();
    if (!cleanToken) {
        localStorage.removeItem(TOKEN_STORAGE_KEY);
        return "";
    }

    localStorage.setItem(TOKEN_STORAGE_KEY, cleanToken);
    return cleanToken;
}

function getGithubHeaders() {
    const token = getGithubToken();
    if (!token) {
        throw new Error("Thiếu TOKEN GitHub. Hãy nhập token hợp lệ trước khi tải ảnh.");
    }

    return {
        "Authorization": `Bearer ${token}`,
        "Accept": "application/vnd.github.v3+json"
    };
}

function setupTokenInput() {
    const tokenInput = document.getElementById("githubTokenInput");
    const saveTokenBtn = document.getElementById("saveTokenBtn");
    const savedToken = getGithubToken();

    if (tokenInput && savedToken) {
        tokenInput.value = savedToken;
    }

    if (saveTokenBtn) {
        saveTokenBtn.addEventListener("click", () => {
            const token = saveGithubToken(tokenInput ? tokenInput.value : "");
            const statusMsg = document.getElementById("statusMessage");

            if (!token) {
                if (statusMsg) {
                    statusMsg.style.color = "#ef4444";
                    statusMsg.innerText = "Token đã bị xoá. Nhập lại token hợp lệ để tiếp tục.";
                }
                return;
            }

            if (statusMsg) {
                statusMsg.style.color = "#10b981";
                statusMsg.innerText = "Token đã được lưu trong trình duyệt.";
            }
        });
    }
}

// Tải danh sách ảnh khi trang web load xong
document.addEventListener("DOMContentLoaded", () => {
    setupTokenInput();
    loadGallery();
});

// 1. Hàm hiển thị danh sách ảnh từ folder images/
async function loadGallery() {
    const gallery = document.getElementById("gallery");
    gallery.innerHTML = "<p>Đang tải danh sách ảnh...</p>";

    try {
        const headers = getGithubHeaders();
        const response = await fetch(API_URL, { headers });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            const message = errorData.message || "Không thể kết nối đến GitHub API";
            throw new Error(message);
        }

        const files = await response.json();
        gallery.innerHTML = "";

        // Lọc và chỉ lấy các file định dạng hình ảnh
        const imageFiles = Array.isArray(files)
            ? files.filter(file => file && file.name && file.name.match(/\.(jpg|jpeg|png|gif|webp)$/i))
            : [];

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
        gallery.innerHTML = `<p style='color: #ef4444;'>Lỗi khi tải ảnh. Kiểm tra lại cấu hình TOKEN / Repo! Chi tiết: ${error.message}</p>`;
    }
}

// 2. Hàm chuyển file sang Base64 để gửi qua API
function fileToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result.split(',')[1]);
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

    try {
        const token = getGithubToken();
        if (!token) {
            throw new Error("Thiếu TOKEN GitHub. Hãy nhập token hợp lệ trước khi upload.");
        }

        const fileName = `${Date.now()}_${file.name.replace(/\s+/g, '_')}`;
        const uploadUrl = `${API_URL}/${fileName}`;

        uploadBtn.disabled = true;
        statusMsg.style.color = "#3b82f6";
        statusMsg.innerText = "Đang đẩy ảnh lên GitHub...";

        const contentBase64 = await fileToBase64(file);

        const response = await fetch(uploadUrl, {
            method: "PUT",
            headers: {
                "Authorization": `Bearer ${token}`,
                "Content-Type": "application/json",
                "Accept": "application/vnd.github.v3+json"
            },
            body: JSON.stringify({
                message: `Upload ảnh: ${fileName}`,
                content: contentBase64
            })
        });

        if (response.ok) {
            statusMsg.style.color = "#10b981";
            statusMsg.innerText = "Upload ảnh thành công!";
            fileInput.value = "";
            setTimeout(loadGallery, 1500);
            return;
        }

        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.message || "Upload thất bại");

    } catch (error) {
        console.error(error);
        statusMsg.style.color = "#ef4444";
        statusMsg.innerText = `Lỗi upload: ${error.message}`;
    } finally {
        uploadBtn.disabled = false;
    }
}