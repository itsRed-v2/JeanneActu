const likedDocuments = [];

async function sendLike(document_id) {
	if (likedDocuments.includes(document_id)) return;
	likedDocuments.push(document_id);

	await fetch(`/api/like/add/${document_id}`, { method: 'POST' });
	updateLikeCounters();
}

function updateLikeCounters() {
	const counters = document.getElementsByClassName('js-like-counter');
	for (const counter of counters) {
		const match = counter.id.match(/\d+$/);
		const id = match[0];

		fetch('/api/like/get/' + id).then(response => {
			if (!response.ok) {
				throw new Error(`HTTP error: ${response.status}`);
			}
			return response.json();
		}).then(responseContent => {
			counter.textContent = responseContent.likes;
		});
	}
}

document.addEventListener("DOMContentLoaded", () => {
	updateLikeCounters();
});