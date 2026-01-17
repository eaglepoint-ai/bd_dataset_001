const api = {
    upload: async (file) => {
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                if (file === 'fail') {
                    reject(new Error('Upload failed'));
                } else {
                    resolve({ success: true });
                }
            }, 2000);
        });
    },
};

export default api;
