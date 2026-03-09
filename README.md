# full-java-modelo
Sistema fullstack simplificado para gerenciamento de autuação de veículos

- créditos da API: Curso Algaworks (Instrutor: Thiago Faria)

### tecnologias
- backend: java 25 e spring boot 4.0.3
- frontend: html / css-tailwind / javascript / node-typescript
- Banco de dados: MySQL com FlyWay (ferramenta de migracão de banco de dados que gerencia alterações no esquema /estrutura de bancos relacionais de forma versionada e controlada)

### diagrama de classes
![Diagrama de Classes](diagrama-classes-api-modelo.png)


### boas práticas
- divisão de responsabilidade entre as classes
- lombok para equals e hashcode com include apenas no atributo ID 

### regras de negócio implementadas
- atualização de email bloqueada para um email que já exista com uso do @ExceptionHandler, retorna status 400 e mensagem personalizada
- data de apreensão do veículo pode ser null no banco de dados, pois na maior parte dos casos o veículo não será apreendido
- apenas 1 unico registro de placa, configuração no banco de dados e na API
- validação em cascata e groups(@ConvertGroup), com validação do formato da placa do veículo (@Pattern)
