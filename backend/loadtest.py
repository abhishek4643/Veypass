from locust import HttpUser, task, between

class VeypassUser(HttpUser):
    wait_time = between(1, 3)

    @task(1)
    def health_check(self):
        self.client.get("/api/health")

    @task(2)
    def view_routes(self):
        self.client.get("/api/routes")

    @task(1)
    def view_seats(self):
        self.client.get("/api/routes/1/seats")
