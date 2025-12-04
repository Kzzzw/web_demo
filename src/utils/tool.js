/**
 * 从文件流下载文件
 * @param path 下载文件的地址
 * @param data
 * @param method
 * @param fileName
 * @param message  报错的提示语
 * @description 一般项目都会配置 dev server
 * 下载地址 path 一定要加上代理转发头。
 */
export const downloadFromStream = (path, data, method = 'GET', fileName,messages = '下载失败') => {
    let token = localStorage.getItem('token');
    let config = {
        url: path,
        method: method,
        responseType: 'blob', // important
        headers: {
            token: token,
        },
    };
    if (method === 'GET') {
        config.params = data;
    } else {
        config.data = data;
    }
    axios(config).then((response) => {
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', fileName);

        document.body.appendChild(link);
        link.click();
        link.parentNode.removeChild(link);
    }).catch((error) => {
        message.warn(messages)
    });
};


/**
 * 查找列表的标签
 * @param list
 * @param value
 * @param key
 * @returns {string|*}
 */
export const findListLabel1 = (list, value, key) => {
    let target = list.find((item) => {
        if (key?.value) {
            return item[key.value] === value;
        } else {
            return item.value === value;
        }
    });
    if (target === undefined) {
        return '--';
    } else {
        if (key?.label) {
            return target[key.label];
        } else {
            return target.label;
        }
    }
};