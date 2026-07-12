import re

def refactor(file_path):
    with open(file_path, 'r') as f:
        content = f.read()

    pattern = r'<motion\.path\s+d="([^"]+)"[^>]+?transition=\{\{\s*pathLength:\s*\{\s*duration:\s*([^,]+),\s*delay:\s*([^,]+)(?:,\s*ease:\s*"([^"]+)")?\s*\}'
    matches = re.findall(pattern, content)
    
    paths_array = "[\n"
    for m in matches:
        d, dur, delay, ease = m
        ease_str = f', ease: "{ease}"' if ease else ''
        paths_array += f'  {{\n    d: "{d}",\n    duration: {dur},\n    delay: {delay}{ease_str}\n  }},\n'
    paths_array += "]"

    comp_name = file_path.split('/')[-1].split('.')[0]
    
    new_content = f"""import AnimatedSignature, {{ SignaturePath }} from './AnimatedSignature';

const paths: SignaturePath[] = {paths_array};

export default function {comp_name}({{ className }}: {{ className?: string }}) {{
  return <AnimatedSignature paths={{paths}} className={{className}} strokeWidth={{0.8}} />;
}}
"""
    with open(file_path, 'w') as f:
        f.write(new_content)

refactor('client/components/svg/Founder1Signature.tsx')
refactor('client/components/svg/Founder2Signature.tsx')
print("Refactored signatures")
