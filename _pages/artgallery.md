---
layout: archive
title: "Photo Wall"
permalink: /photo-wall/
redirect_from:
  - /artgallery/
author_profile: true
---

<p class="page__lead">A small space for fieldwork, travel, and everyday moments beyond the lab.</p>

{% assign photos = site.data.photo_wall.photos %}
{% if photos and photos.size > 0 %}
  <div class="photo-wall" role="list">
    {% for photo in photos %}
      <figure class="photo-wall__item" role="listitem">
        <img src="{{ base_path }}{{ photo.src }}" alt="{{ photo.alt | default: photo.caption }}" loading="lazy">
        {% if photo.caption %}<figcaption>{{ photo.caption }}</figcaption>{% endif %}
      </figure>
    {% endfor %}
  </div>
{% else %}
  <section class="photo-wall__empty" aria-label="Photo wall is currently empty">
    <i class="fa-solid fa-camera-retro" aria-hidden="true"></i>
    <h2>Photos coming soon</h2>
    <p>This wall is ready for new memories. Check back soon.</p>
  </section>
{% endif %}
