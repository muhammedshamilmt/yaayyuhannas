// Test script to verify button state logic
console.log('🧪 Testing Register Button Logic');

// Simulate the exact conditions from your app
const selectedParticipants = ['423', '202', '424']; // From your console logs
const requiredParticipants = 3;
const isSubmitting = false;

// Test the button enabled condition
const isButtonEnabled = selectedParticipants.length === requiredParticipants && !isSubmitting;

console.log('📊 Test Results:');
console.log('Selected participants:', selectedParticipants);
console.log('Required participants:', requiredParticipants);
console.log('Is submitting:', isSubmitting);
console.log('Selected count:', selectedParticipants.length);
console.log('Count matches required:', selectedParticipants.length === requiredParticipants);
console.log('Button should be enabled:', isButtonEnabled);

// Test button text
let buttonText;
if (isSubmitting) {
    buttonText = 'Registering...';
} else if (selectedParticipants.length === requiredParticipants) {
    buttonText = '🎉 REGISTER TEAM';
} else {
    buttonText = selectedParticipants.length === 0 
        ? `SELECT ${requiredParticipants} PARTICIPANTS`
        : `NEED ${requiredParticipants - selectedParticipants.length} MORE`;
}

console.log('Button text should be:', buttonText);
console.log('Button CSS class should include:', isButtonEnabled ? 'bg-green-600' : 'bg-gray-400');

if (isButtonEnabled) {
    console.log('✅ SUCCESS: Button should be enabled and green!');
} else {
    console.log('❌ ISSUE: Button should be disabled');
}