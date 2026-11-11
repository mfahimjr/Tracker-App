<?php

namespace Tests\Feature;

use App\Models\User;
use Database\Seeders\RoleSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AuthTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed(RoleSeeder::class);
    }

    private function makeUser(array $overrides = []): User
    {
        $user = User::factory()->create(array_merge([
            'email' => 'aina@pepper.my',
            'password' => 'demo1234',
        ], $overrides));

        $user->assignRole('Admin');

        return $user;
    }

    public function test_login_with_valid_credentials_returns_the_user(): void
    {
        $this->makeUser();

        $this->postJson('/api/login', ['email' => 'aina@pepper.my', 'password' => 'demo1234'])
            ->assertOk()
            ->assertJsonPath('data.email', 'aina@pepper.my')
            ->assertJsonPath('data.role', 'Admin');

        $this->assertAuthenticated();
    }

    public function test_login_with_wrong_password_returns_422(): void
    {
        $this->makeUser();

        $this->postJson('/api/login', ['email' => 'aina@pepper.my', 'password' => 'wrong'])
            ->assertUnprocessable()
            ->assertJsonValidationErrors('email');

        $this->assertGuest();
    }

    public function test_inactive_user_cannot_log_in(): void
    {
        $this->makeUser(['is_active' => false]);

        $this->postJson('/api/login', ['email' => 'aina@pepper.my', 'password' => 'demo1234'])
            ->assertUnprocessable()
            ->assertJsonValidationErrors('email');

        $this->assertGuest();
    }

    public function test_me_requires_a_session(): void
    {
        $this->getJson('/api/me')->assertUnauthorized();
    }

    public function test_me_returns_the_signed_in_user(): void
    {
        $user = $this->makeUser();

        $this->actingAs($user, 'web')
            ->getJson('/api/me')
            ->assertOk()
            ->assertJsonPath('data.id', $user->id)
            ->assertJsonPath('data.role', 'Admin');
    }

    public function test_logout_ends_the_session(): void
    {
        $user = $this->makeUser();

        $this->actingAs($user, 'web')->postJson('/api/logout')->assertNoContent();

        $this->app['auth']->forgetGuards();
        $this->getJson('/api/me')->assertUnauthorized();
    }
}
