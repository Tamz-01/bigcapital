FROM bigcapitalhq/webapp@sha256:7ce33209c225175264eca4a6adea9a398662ae1e3400d4d9a6857523cc2d4a56
COPY packages/webapp/dist/ /usr/share/nginx/html/
COPY docker/test-system-banner.js /usr/share/nginx/html/test-system-banner.js
RUN sed -i 's@</body>@<script src="/test-system-banner.js"></script></body>@' /usr/share/nginx/html/index.html
