# **App Name**: Service Flow Dashboard

## Core Features:

- User Authentication: Implement email/password login using Firebase Authentication.
- Dashboard Layout: Create a fixed sidebar navigation menu with links to Dashboard, Cadastro, Engenharia, Técnica, Digitação, Medicina, and Gráficos.
- Service Registration Form: Implement a form in the /cadastro route to capture service details: cnpj, nomeEmpresa, cep (with automatic address lookup), cidade, endereco, bairro, complemento, telefone, contato, servico (with ability to add multiple services), dataServico.
- Data Persistence: Upon saving the registration form, store data in a Firestore collection named 'servicos'. Each document should include a 'status' field initialized to 'engenharia'.
- Engineering Workflow: Display all services with status 'engenharia' in a table on the /engenharia route, showing key details like nomeEmpresa, servico, dataServico, and providing 'Edit' and 'Delete' actions.
- Real-time Notifications: Implement a notification counter on the 'Engenharia' link in the sidebar, displaying the number of services pending in that stage. Reset the counter when the page is visited.

## Style Guidelines:

- Primary color: Use Azul Principal (#4A90E2) for a professional look, drawing directly from the reference image.
- Background color: Use Cinza Claro (#F5F6FA), inspired by the image, as the primary background to maintain a clean interface.
- Accent color: Incorporate Verde Esmeralda (#2ECC71) for positive actions such as saving or adding.
- Body and headline font: 'Inter', a grotesque-style sans-serif, will be used throughout for a modern, neutral look that ensures readability in both headlines and body text.
- Maintain a fixed sidebar for easy navigation and a consistent user experience.
- Use simple, consistent icons to represent different sections and actions in the dashboard.