document.addEventListener("DOMContentLoaded", () => {
  console.log("Campus Hub frontend loaded successfully.");
});


/* Filter clubs by name or interest */
const clubSearch = document.getElementById("clubSearch");

if (clubSearch) {
  const clubCards = document.querySelectorAll(".club-card");
  const clubCount = document.getElementById("clubCount");
  const noClubsMessage = document.getElementById("noClubsMessage");

  clubSearch.addEventListener("input", () => {
    const query = clubSearch.value.trim().toLowerCase();
    let visibleCount = 0;

    clubCards.forEach((card) => {
      const searchableText = (
        card.dataset.name + " " + card.textContent
      ).toLowerCase();

      const matches = searchableText.includes(query);

      card.hidden = !matches;

      if (matches) {
        visibleCount++;
      }
    });

    clubCount.textContent = visibleCount;
    noClubsMessage.hidden = visibleCount !== 0;
  });
}
