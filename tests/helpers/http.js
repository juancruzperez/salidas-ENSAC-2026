async function requestJson(baseUrl, body, cookie = '') {
    const headers = {
        'Content-Type': 'application/json'
    };

    if (cookie) {
        headers.Cookie = cookie;
    }

    const response = await fetch(
        `${baseUrl}/api/docentes`,
        {
            method: 'POST',
            headers,
            body: JSON.stringify(body)
        }
    );

    let data = null;

    try {
        data = await response.json();
    } catch {
        data = null;
    }

    return {
        status: response.status,
        data
    };
}

module.exports = {
    requestJson
};
