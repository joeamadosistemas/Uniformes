# ===========================================================
# Script: Criar Usuários em Lote no Supabase Authentication
# Projeto: Sistema de Controle de Uniformes - SMEDU/CPD Itaguai
# ===========================================================

$SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpsa2NtZnVyaGJoZWFzYXFqaG5qIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MjQ2NDExNiwiZXhwIjoyMDg4MDQwMTE2fQ.jKO27Ftqu4GoYNVpDUkdqR1yJ2oRaGzluaS6D9f98ro"

$SUPABASE_URL = "https://zlkcmfurhbheasaqjhnj.supabase.co"
$ADMIN_API = "$SUPABASE_URL/auth/v1/admin/users"

$headers = @{
    "apikey"        = $SERVICE_ROLE_KEY
    "Authorization" = "Bearer $SERVICE_ROLE_KEY"
    "Content-Type"  = "application/json"
}

# Lista completa de usuários
$users = @(
    @{ email = "cpdinfra@edu.itaguai.rj.gov.br"; password = "T3c4n3x0" },
    @{ email = "joe.amado@edu.itaguai.rj.gov.br"; password = "Itaguai@2026" },
    @{ email = "cm.senadorteotoniovilella@edu.itaguai.rj.gov.br"; password = "smedunif" },
    @{ email = "em.alexandreignacio@edu.itaguai.rj.gov.br"; password = "smedunif" },
    @{ email = "em.amauriferreira@edu.itaguai.rj.gov.br"; password = "smedunif" },
    @{ email = "em.antoniotupinamba@edu.itaguai.rj.gov.br"; password = "smedunif" },
    @{ email = "em.argentinacoutinho@edu.itaguai.rj.gov.br"; password = "smedunif" },
    @{ email = "em.celalzirosantiago@edu.itaguai.rj.gov.br"; password = "smedunif" },
    @{ email = "em.acacias@edu.itaguai.rj.gov.br"; password = "smedunif" },
    @{ email = "em.eiderribeirodantas@edu.itaguai.rj.gov.br"; password = "smedunif" },
    @{ email = "em.elmirafigueira@edu.itaguai.rj.gov.br"; password = "smedunif" },
    @{ email = "em.elmobaptistacoelho@edu.itaguai.rj.gov.br"; password = "smedunif" },
    @{ email = "em.fusaofukmati@edu.itaguai.rj.gov.br"; password = "smedunif" },
    @{ email = "em.marianildesiqueiragoncalves@edu.itaguai.rj.gov.br"; password = "smedunif" },
    @{ email = "em.joaovicentesoares@edu.itaguai.rj.gov.br"; password = "smedunif" },
    @{ email = "em.jorgefloresdasilva@edu.itaguai.rj.gov.br"; password = "smedunif" },
    @{ email = "em.oscarjosedesouza@edu.itaguai.rj.gov.br"; password = "smedunif" },
    @{ email = "em.padrerafaelscarfo@edu.itaguai.rj.gov.br"; password = "smedunif" },
    @{ email = "em.prefalbeilardgoulartdesouza@edu.itaguai.rj.gov.br"; password = "smedunif" },
    @{ email = "em.prefotonirocha@edu.itaguai.rj.gov.br"; password = "smedunif" },
    @{ email = "em.prefwilsonpedrofrancisco@edu.itaguai.rj.gov.br"; password = "smedunif" },
    @{ email = "em.mariaguilherminadesouzafreire@edu.itaguai.rj.gov.br"; password = "smedunif" },
    @{ email = "em.serverinadosramosdesousa@edu.itaguai.rj.gov.br"; password = "smedunif" },
    @{ email = "em.yolandarangelpereira@edu.itaguai.rj.gov.br"; password = "smedunif" },
    @{ email = "em.renatogoncalvesmartins@edu.itaguai.rj.gov.br"; password = "smedunif" },
    @{ email = "em.saosebastiao@edu.itaguai.rj.gov.br"; password = "smedunif" },
    @{ email = "em.severinosalustianodefarias@edu.itaguai.rj.gov.br"; password = "smedunif" },
    @{ email = "em.terezadearaujosagario@edu.itaguai.rj.gov.br"; password = "smedunif" },
    @{ email = "em.veramericorodriguesdeamorim@edu.itaguai.rj.gov.br"; password = "smedunif" },
    @{ email = "em.verjosegalliacoprata@edu.itaguai.rj.gov.br"; password = "smedunif" },
    @{ email = "em.vertaianofernandesnunes@edu.itaguai.rj.gov.br"; password = "smedunif" },
    @{ email = "ciep300@edu.itaguai.rj.gov.br"; password = "smedunif" },
    @{ email = "ciep496@edu.itaguai.rj.gov.br"; password = "smedunif" },
    @{ email = "ciep497@edu.itaguai.rj.gov.br"; password = "smedunif" },
    @{ email = "eem.camilocuquejo@edu.itaguai.rj.gov.br"; password = "smedunif" },
    @{ email = "eem.carmemmenezesdireito@edu.itaguai.rj.gov.br"; password = "smedunif" },
    @{ email = "eem.chapero@edu.itaguai.rj.gov.br"; password = "smedunif" },
    @{ email = "eem.drjorgeabrahao@edu.itaguai.rj.gov.br"; password = "smedunif" },
    @{ email = "eem.fazsantacandida@edu.itaguai.rj.gov.br"; password = "smedunif" },
    @{ email = "eem.pedroantoniodeaguiar@edu.itaguai.rj.gov.br"; password = "smedunif" },
    @{ email = "eem.santarosa@edu.itaguai.rj.gov.br"; password = "smedunif" },
    @{ email = "eem.tacianobasilio@edu.itaguai.rj.gov.br"; password = "smedunif" },
    @{ email = "emei.hypolitovieiradecarvalho@edu.itaguai.rj.gov.br"; password = "smedunif" },
    @{ email = "emei.monteirolobato@edu.itaguai.rj.gov.br"; password = "smedunif" },
    @{ email = "emei.prefisoldacksoncruzdebrito@edu.itaguai.rj.gov.br"; password = "smedunif" },
    @{ email = "cm.aparecidaazedo@edu.itaguai.rj.gov.br"; password = "smedunif" },
    @{ email = "cm.mariaeduvigesdorosariosilva@edu.itaguai.rj.gov.br"; password = "smedunif" },
    @{ email = "cm.daniellebatistadasilva@edu.itaguai.rj.gov.br"; password = "smedunif" },
    @{ email = "cm.edsoncruzamado@edu.itaguai.rj.gov.br"; password = "smedunif" },
    @{ email = "cm.euclydesjoseborges@edu.itaguai.rj.gov.br"; password = "smedunif" },
    @{ email = "cm.estreladoceu@edu.itaguai.rj.gov.br"; password = "smedunif" },
    @{ email = "cm.florentinoelias@edu.itaguai.rj.gov.br"; password = "smedunif" },
    @{ email = "cm.franciscoxavierdemourabrito@edu.itaguai.rj.gov.br"; password = "smedunif" },
    @{ email = "cm.jardimmar@edu.itaguai.rj.gov.br"; password = "smedunif" },
    @{ email = "cm.joaquiminoue@edu.itaguai.rj.gov.br"; password = "smedunif" },
    @{ email = "cm.renatobarbosaladislau@edu.itaguai.rj.gov.br"; password = "smedunif" },
    @{ email = "cm.elianelopesbarbosa@edu.itaguai.rj.gov.br"; password = "smedunif" },
    @{ email = "cm.mariacristinapadelacabraldasilva@edu.itaguai.rj.gov.br"; password = "smedunif" },
    @{ email = "cm.mariadelurdessgarcia@edu.itaguai.rj.gov.br"; password = "smedunif" },
    @{ email = "cm.taniamaramottademenezes@edu.itaguai.rj.gov.br"; password = "smedunif" },
    @{ email = "cm.ritaferreirafeijo@edu.itaguai.rj.gov.br"; password = "smedunif" },
    @{ email = "cm.mariarosagomesdonascimento@edu.itaguai.rj.gov.br"; password = "smedunif" },
    @{ email = "cemaee@edu.itaguai.rj.gov.br"; password = "smedunif" },
    @{ email = "cm.goethecoutinhomadruga@edu.itaguai.rj.gov.br"; password = "smedunif" },
    @{ email = "em.sylviasouzasiquineli@edu.itaguai.rj.gov.br"; password = "smedunif" },
    @{ email = "cm.verjoseantoniocarrasco@edu.itaguai.rj.gov.br"; password = "smedunif" }
)

$success = 0
$failed = 0
$skipped = 0

Write-Host "`n=== Criando $($users.Count) usuarios no Supabase ===" -ForegroundColor Cyan
Write-Host ""

foreach ($user in $users) {
    $body = @{
        email         = $user.email
        password      = $user.password
        email_confirm = $true
    } | ConvertTo-Json -Compress

    try {
        $res = Invoke-RestMethod `
            -Uri $ADMIN_API `
            -Method POST `
            -Headers $headers `
            -Body $body `
            -ErrorAction Stop

        Write-Host "  [OK] $($user.email)" -ForegroundColor Green
        $success++
    }
    catch {
        $statusCode = $_.Exception.Response.StatusCode.value__
        $errBody = ""
        try {
            $stream = $_.Exception.Response.GetResponseStream()
            $reader = [System.IO.StreamReader]::new($stream)
            $errBody = $reader.ReadToEnd() | ConvertFrom-Json
        }
        catch {}

        if ($statusCode -eq 422 -or ($errBody.message -like "*already*")) {
            Write-Host "  [JA EXISTE] $($user.email)" -ForegroundColor Yellow
            $skipped++
        }
        else {
            Write-Host "  [ERRO $statusCode] $($user.email) - $($errBody.message)" -ForegroundColor Red
            $failed++
        }
    }

    Start-Sleep -Milliseconds 300
}

Write-Host ""
Write-Host "=== Resultado ===" -ForegroundColor Cyan
Write-Host "  Criados com sucesso : $success" -ForegroundColor Green
Write-Host "  Ja existiam         : $skipped" -ForegroundColor Yellow
Write-Host "  Erros               : $failed"  -ForegroundColor Red
Write-Host ""
