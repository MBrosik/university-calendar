# Użyj obrazu Node.js jako bazowego obrazu
FROM node:latest

# Utwórz katalog roboczy wewnątrz kontenera
WORKDIR /usr/src/app

# Skopiuj plik package.json i package-lock.json (jeśli istnieje)
COPY package*.json ./

# Zainstaluj zależności aplikacji
RUN npm install

# Skopiuj resztę plików projektu do katalogu roboczego wewnątrz kontenera
COPY . .

# Skompiluj TypeScript, jeśli jest potrzebne
RUN npm run build

# Otwórz port, na którym działa aplikacja
EXPOSE 8000

# Uruchom aplikację
CMD ["npm", "start"]
