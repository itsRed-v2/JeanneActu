const infoParagraphs = [
	'Des articles sur la vie du lycée, l’actualité, des conseils de films, de musiques, de jeux vidéo et bien d’autres encore. Voilà ce que le Club journal <a class="invisible-link" href="https://youtu.be/dQw4w9WgXcQ?si=410pMiFK14rJdIfg" target="_blank">vous</a> propose dans son mensuel ‘Jeanne Actu’.',
	'Le journal Jeanne Actu vient vous proposer des articles sur <a class="invisible-link" href="https://youtu.be/dQw4w9WgXcQ?si=410pMiFK14rJdIfg" target="_blank">l’actualité</a> dans le monde ainsi que dans votre lycée. Il saura vous ravir avec ses nombreuses rubriques sur des sujets divers et variés.',
	'Le journal Jeanne Actu vient vous <a class="invisible-link" href="https://youtu.be/dQw4w9WgXcQ?si=410pMiFK14rJdIfg" target="_blank">proposer</a> des articles sur l’actualité dans le monde ainsi que dans votre lycée. Il saura vous ravir avec ses rubriques parlant autant de politique que d’art et de cinéma.',
]

document.addEventListener('DOMContentLoaded', () => {
	const info = document.getElementById('info');
	const paragraph = infoParagraphs[Math.floor(Math.random() * 3)];
	info.innerHTML = paragraph;
});